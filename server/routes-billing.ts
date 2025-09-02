import type { Express } from "express";
import Stripe from "stripe";
import { requireUser } from "./auth";
import { checkoutRateLimit } from "./middleware/rateLimiter";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

const APP_BASE_URL = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
  : 'http://localhost:5000';

export function registerBillingRoutes(app: Express) {
  
  // Create Stripe Checkout Session
  app.post("/api/billing/create-checkout-session", checkoutRateLimit, requireUser, async (req, res) => {
    try {
      const { priceId, trialDays } = req.body;
      const user = (req as any).user;
      
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      // Get price details to determine mode
      const price = await stripe.prices.retrieve(priceId);
      const product = await stripe.products.retrieve(price.product as string);
      
      const isSubscription = price.type === 'recurring';
      
      // Get or create Stripe customer
      let customerId: string;
      
      // Try to find existing customer by email
      if (user.email) {
        const existingCustomers = await stripe.customers.list({
          email: user.email,
          limit: 1
        });
        
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              user_id: user.id
            }
          });
          customerId = customer.id;
        }
      } else {
        const customer = await stripe.customers.create({
          metadata: {
            user_id: user.id
          }
        });
        customerId = customer.id;
      }

      // Create checkout session
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: isSubscription ? 'subscription' : 'payment',
        success_url: `${APP_BASE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_BASE_URL}/billing/cancel`,
        metadata: {
          user_id: user.id,
          product_sku: product.metadata?.sku || product.name
        }
      };

      // Add subscription trial if specified
      if (isSubscription && trialDays && trialDays > 0) {
        sessionConfig.subscription_data = {
          trial_period_days: trialDays,
          metadata: {
            user_id: user.id,
            product_sku: product.metadata?.sku || product.name
          }
        };
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      res.json({ 
        sessionId: session.id,
        url: session.url 
      });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session: " + error.message });
    }
  });

  // Get Stripe Customer Portal link
  app.get("/api/billing/portal", requireUser, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (!user.email) {
        return res.status(400).json({ error: "User email is required for portal access" });
      }

      // Find customer by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (customers.data.length === 0) {
        return res.status(404).json({ error: "No billing account found" });
      }

      const portal = await stripe.billingPortal.sessions.create({
        customer: customers.data[0].id,
        return_url: `${APP_BASE_URL}/catalog`,
      });

      res.json({ url: portal.url });
    } catch (error: any) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to create portal session: " + error.message });
    }
  });

  // Stripe Webhook Handler
  app.post("/api/billing/webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      // In production, you should set the webhook endpoint secret
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (endpointSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } else {
        // For development, just parse the body
        event = req.body;
      }
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Received webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
          
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
          
        case 'invoice.paid':
          await handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;
          
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error(`Error processing webhook:`, error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Get checkout session details
  app.get("/api/billing/session/:sessionId", requireUser, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer', 'subscription', 'payment_intent']
      });

      res.json({
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email,
        amount_total: session.amount_total,
        currency: session.currency,
        subscription_id: session.subscription,
        payment_intent_id: session.payment_intent
      });
    } catch (error: any) {
      console.error("Error retrieving session:", error);
      res.status(500).json({ error: "Failed to retrieve session" });
    }
  });

  // Get user purchases for access control
  app.get("/api/billing/purchases", requireUser, async (req, res) => {
    try {
      const user = (req as any).user;
      
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/purchases?user_id=eq.${user.id}&select=*`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const purchases = await response.json();
      res.json(purchases);
    } catch (error: any) {
      console.error("Error fetching user purchases:", error);
      res.status(500).json({ error: "Failed to fetch purchases" });
    }
  });

  // Check access to specific course
  app.get("/api/billing/access/:courseSlug", requireUser, async (req, res) => {
    try {
      const { courseSlug } = req.params;
      const user = (req as any).user;
      
      // Get course details
      const courseResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/courses?slug=eq.${courseSlug}&select=*`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!courseResponse.ok) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const courses = await courseResponse.json();
      if (courses.length === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const course = courses[0];

      // If course is free, allow access
      if (course.is_free) {
        return res.json({ canAccess: true, reason: 'free_course' });
      }

      // Check user purchases for required product
      if (!course.requires_product_sku) {
        return res.json({ canAccess: false, reason: 'no_product_required' });
      }

      const purchaseResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/purchases?user_id=eq.${user.id}&product_sku=eq.${course.requires_product_sku}&select=*`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!purchaseResponse.ok) {
        throw new Error(`HTTP ${purchaseResponse.status}`);
      }

      const purchases = await purchaseResponse.json();
      const activePurchase = purchases.find((p: any) => 
        ['trialing', 'active'].includes(p.status)
      );

      if (!activePurchase) {
        return res.json({ canAccess: false, reason: 'no_purchase' });
      }

      // Check if trial has expired
      if (activePurchase.status === 'trialing' && activePurchase.trial_ends_at) {
        const trialEnd = new Date(activePurchase.trial_ends_at);
        const now = new Date();
        if (trialEnd <= now) {
          return res.json({ canAccess: false, reason: 'trial_expired' });
        }
      }

      res.json({ canAccess: true, reason: activePurchase.status, purchase: activePurchase });
    } catch (error: any) {
      console.error("Error checking course access:", error);
      res.status(500).json({ error: "Failed to check access" });
    }
  });
}

// Webhook event handlers
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);
  
  const userId = session.metadata?.user_id;
  const productSku = session.metadata?.product_sku;
  
  if (!userId || !productSku) {
    console.error('Missing metadata in checkout session:', { userId, productSku });
    return;
  }

  try {
    // Create purchase record in Supabase
    const purchaseData = {
      user_id: userId,
      product_sku: productSku,
      amount_cents: session.amount_total || 0,
      stripe_payment_intent_id: session.payment_intent as string || null,
      stripe_subscription_id: session.subscription as string || null,
      stripe_customer_id: session.customer as string,
      status: session.subscription ? 'trialing' : 'completed',
      purchased_at: new Date().toISOString()
    };

    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/purchases`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(purchaseData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log('Purchase record created successfully');
  } catch (error) {
    console.error('Error creating purchase record:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription update:', subscription.id);
  
  const userId = subscription.metadata?.user_id;
  
  if (!userId) {
    console.error('Missing user_id in subscription metadata');
    return;
  }

  try {
    const updateData = {
      status: subscription.status,
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
    };

    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/purchases?stripe_subscription_id=eq.${subscription.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log('Subscription status updated successfully');
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deletion:', subscription.id);
  
  try {
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/purchases?stripe_subscription_id=eq.${subscription.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'canceled' })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log('Subscription marked as canceled');
  } catch (error) {
    console.error('Error marking subscription as canceled:', error);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Processing invoice.paid:', invoice.id);
  
  const subscriptionId = (invoice as any).subscription;
  if (subscriptionId) {
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/purchases?stripe_subscription_id=eq.${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'active' })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log('Subscription marked as active after payment');
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);
  
  const subscriptionId = (invoice as any).subscription;
  if (subscriptionId) {
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/purchases?stripe_subscription_id=eq.${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'past_due' })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log('Subscription marked as past_due after failed payment');
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  }
}