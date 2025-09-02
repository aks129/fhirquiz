import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Loader2, Check, Star, Clock, Users, Award, BookOpen, Zap, Target } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price_cents: number;
  stripe_price_id: string | null;
  is_active: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  features: string[];
  limitations?: string[];
  cta: string;
  trialDays?: number;
  product?: Product;
}

export default function Pricing() {
  const { user, isLoading: authLoading } = useAuth();
  
  // Check if we're in demo mode
  const isDemo = !user && localStorage.getItem('demo_mode') === 'true';
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  // Fetch active products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/admin/products'],
    retry: false,
    select: (data: Product[]) => data.filter(p => p.is_active && p.stripe_price_id)
  });

  // Create checkout session mutation
  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, trialDays }: { priceId: string; trialDays?: number }) => {
      const response = await apiRequest('POST', '/api/billing/create-checkout-session', {
        priceId,
        trialDays
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Redirecting to checkout",
        description: "Taking you to secure Stripe checkout to complete your purchase.",
        variant: "default"
      });
      
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: "Checkout Error",
        description: error.message,
        variant: "destructive"
      });
      setLoadingTier(null);
    }
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  // Demo mode mock purchase handler
  const handleDemoPurchase = (tier: PricingTier) => {
    setLoadingTier(tier.id);
    
    // Simulate checkout delay
    setTimeout(() => {
      // Store mock purchase in localStorage
      const demoData = JSON.parse(localStorage.getItem('demo_user_data') || '{}');
      const purchases = demoData.purchases || [];
      
      const newPurchase = {
        id: `demo_${tier.id}_${Date.now()}`,
        product_sku: tier.product?.sku || tier.id,
        purchased_at: new Date().toISOString(),
        expires_at: tier.trialDays ? 
          new Date(Date.now() + tier.trialDays * 24 * 60 * 60 * 1000).toISOString() : 
          null,
        is_trial: !!tier.trialDays
      };
      
      purchases.push(newPurchase);
      demoData.purchases = purchases;
      localStorage.setItem('demo_user_data', JSON.stringify(demoData));
      
      toast({
        title: "Purchase Successful! 🎉",
        description: `You now have access to ${tier.name}. ${tier.trialDays ? `Your ${tier.trialDays}-day trial has started.` : 'Enjoy your course!'}`,
        variant: "default"
      });
      
      setLoadingTier(null);
    }, 1500);
  };

  const handlePurchase = async (tier: PricingTier) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase courses",
        variant: "destructive"
      });
      return;
    }

    // Handle demo mode
    if (isDemo) {
      handleDemoPurchase(tier);
      return;
    }

    if (!tier.product?.stripe_price_id) {
      toast({
        title: "Product Unavailable",
        description: "This product is not configured for purchase",
        variant: "destructive"
      });
      return;
    }

    setLoadingTier(tier.id);
    checkoutMutation.mutate({
      priceId: tier.product.stripe_price_id,
      trialDays: tier.trialDays
    });
  };

  // Map products to pricing tiers
  const getPricingTiers = (): PricingTier[] => {
    const basicProduct = products.find(p => 
      p.sku === 'FHIR-BASIC' || p.sku === 'fhir-bootcamp-basic'
    );
    const plusProduct = products.find(p => 
      p.sku === 'FHIR-PRO' || p.sku === 'fhir-bootcamp-plus'
    );

    return [
      {
        id: 'free-trial',
        name: 'Free Trial',
        description: 'Try before you buy',
        price: 0,
        features: [
          'Access to FHIR 101 course',
          'Basic FHIR concepts and terminology',
          'Introduction to healthcare data',
          'Community forum access',
          '7 days to explore'
        ],
        limitations: [
          'Limited to introductory content',
          'No certification',
          'No advanced labs'
        ],
        cta: 'Start Free Trial',
        trialDays: 7
      },
      {
        id: 'bootcamp-basic',
        name: 'Bootcamp Basic',
        description: 'Complete FHIR training program',
        price: basicProduct?.price_cents || 49900,
        originalPrice: basicProduct?.price_cents ? Math.round(basicProduct.price_cents * 1.4) : 69900,
        features: [
          'Complete 3-day FHIR bootcamp curriculum',
          'Hands-on labs with synthetic data',
          'FHIR server setup and configuration',
          'Data ingestion and transformation',
          'Basic analytics and reporting',
          'Certificate of completion',
          '30-day access to materials',
          'Email support'
        ],
        cta: 'Start 7-Day Free Trial',
        trialDays: 7,
        product: basicProduct
      },
      {
        id: 'bootcamp-plus',
        name: 'Bootcamp Plus',
        description: 'Advanced FHIR mastery with Deep Dive',
        price: plusProduct?.price_cents || 79900,
        originalPrice: plusProduct?.price_cents ? Math.round(plusProduct.price_cents * 1.3) : 99900,
        popular: true,
        features: [
          'Everything in Basic, plus:',
          'Advanced FHIR interoperability patterns',
          'FHIR Deep Dive course access',
          'Custom data transformation scripts',
          'Production-ready deployment guides',
          'BYOD (Bring Your Own Data) workshops',
          'Priority instructor support',
          '90-day access to materials',
          'Professional certificate',
          'Slack community access'
        ],
        cta: 'Start 7-Day Free Trial',
        trialDays: 7,
        product: plusProduct
      }
    ];
  };

  const pricingTiers = getPricingTiers();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-pricing">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading pricing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Learning Path</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Master FHIR and healthcare interoperability with our comprehensive training programs
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Self-paced learning</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Expert instruction</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>Industry certification</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => {
            const loading = loadingTier === tier.id;
            
            return (
              <Card 
                key={tier.id}
                className={`relative ${tier.popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}
                data-testid={`pricing-card-${tier.id}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription className="text-base mb-4">
                    {tier.description}
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {tier.price === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span className="text-blue-600">
                          {formatPrice(tier.price)}
                        </span>
                      )}
                    </div>
                    
                    {tier.originalPrice && tier.price > 0 && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(tier.originalPrice)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Save {Math.round((1 - tier.price / tier.originalPrice) * 100)}%
                        </Badge>
                      </div>
                    )}
                    
                    {tier.trialDays && tier.price > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {tier.trialDays}-day free trial included
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations (for free tier) */}
                  {tier.limitations && (
                    <div className="pt-4 border-t space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Limitations:</h4>
                      {tier.limitations.map((limitation, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span>•</span>
                          <span>{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA Button */}
                  <div className="pt-4">
                    <Button 
                      className={`w-full ${tier.popular ? 'bg-blue-600 hover:bg-blue-700' : ''} ${
                        tier.id === 'free-trial' ? 'bg-green-600 hover:bg-green-700' : ''
                      }`}
                      onClick={() => handlePurchase(tier)}
                      disabled={loading}
                      data-testid={`cta-${tier.id}`}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {tier.id === 'free-trial' ? (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          {tier.cta}
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          {tier.cta}
                        </>
                      )}
                    </Button>
                  </div>

                  {tier.price > 0 && (
                    <div className="text-xs text-muted-foreground text-center pt-2 space-y-1">
                      <div>30-day money-back guarantee</div>
                      <div>Cancel anytime during trial</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Demo Mode Notice */}
        {isDemo && (
          <div className="max-w-md mx-auto mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Demo Mode Active
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Purchases are simulated for demonstration. No real charges will be made.
              </p>
            </div>
          </div>
        )}

        {!user && !isDemo && (
          <div className="max-w-md mx-auto mt-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Sign In Required
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Please sign in with your account to purchase courses and access the bootcamp materials.
              </p>
              <Link href="/auth">
                <Button className="w-full">
                  Sign In to Continue
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="max-w-4xl mx-auto mt-16 space-y-8">
          {/* Why Choose Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Why Choose Our FHIR Bootcamp?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Target className="h-8 w-8 text-blue-600 mx-auto" />
                <h3 className="font-semibold">Practical Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Hands-on labs with real synthetic patient data from Synthea
                </p>
              </div>
              <div className="space-y-2">
                <Users className="h-8 w-8 text-blue-600 mx-auto" />
                <h3 className="font-semibold">Expert Instruction</h3>
                <p className="text-sm text-muted-foreground">
                  Learn from healthcare interoperability professionals
                </p>
              </div>
              <div className="space-y-2">
                <Award className="h-8 w-8 text-blue-600 mx-auto" />
                <h3 className="font-semibold">Industry Recognition</h3>
                <p className="text-sm text-muted-foreground">
                  Certificates recognized by healthcare organizations
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">How do free trials work?</h3>
                <p className="text-muted-foreground">
                  Free trials give you 7 days of full access to course materials. You can cancel anytime during the trial 
                  without being charged. After the trial, you'll be billed for the full course unless you cancel.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What's the difference between Basic and Plus?</h3>
                <p className="text-muted-foreground">
                  Basic includes the core 3-day bootcamp curriculum. Plus adds the advanced FHIR Deep Dive course, 
                  BYOD workshops, priority support, and extended access (90 vs 30 days).
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Do I need prior FHIR experience?</h3>
                <p className="text-muted-foreground">
                  No prior FHIR experience is required. The bootcamp starts with fundamentals and progressively builds 
                  to advanced topics. Some healthcare or technical background is helpful but not mandatory.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Is there a money-back guarantee?</h3>
                <p className="text-muted-foreground">
                  Yes! We offer a 30-day money-back guarantee. If you're not satisfied with the course content, 
                  contact our support team for a full refund within 30 days of purchase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}