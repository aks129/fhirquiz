import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Star, Clock, CheckCircle, ExternalLink } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price_cents: number;
  stripe_price_id: string | null;
  is_active: boolean;
}

interface StripePrice {
  id: string;
  type: 'one_time' | 'recurring';
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
}

export default function Catalog() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);

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
      // Show checkout initiation toast
      toast({
        title: "Redirecting to checkout",
        description: "Taking you to secure Stripe checkout to complete your purchase.",
        variant: "default"
      });
      
      // Redirect to Stripe Checkout
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
      setLoadingProduct(null);
    }
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const handlePurchase = async (product: Product, trialDays?: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase courses",
        variant: "destructive"
      });
      return;
    }

    if (!product.stripe_price_id) {
      toast({
        title: "Product Unavailable",
        description: "This product is not configured for purchase",
        variant: "destructive"
      });
      return;
    }

    setLoadingProduct(product.id);
    checkoutMutation.mutate({
      priceId: product.stripe_price_id,
      trialDays
    });
  };

  const getProductFeatures = (sku: string) => {
    const features = {
      'FHIR-BASIC': [
        'Complete 3-day FHIR bootcamp curriculum',
        'Hands-on labs with synthetic data',
        'FHIR server setup and configuration',
        'Data ingestion and transformation',
        'Basic analytics and reporting',
        '30-day access to materials'
      ],
      'FHIR-PRO': [
        'Everything in Basic, plus:',
        'Advanced FHIR interoperability patterns',
        'Custom data transformation scripts',
        'Production-ready deployment guides',
        'BYOD (Bring Your Own Data) workshops',
        'Priority instructor support',
        '90-day access to materials',
        'Certificate of completion'
      ],
      'FHIR-ENTERPRISE': [
        'Everything in Pro, plus:',
        'Private instructor-led sessions',
        'Custom curriculum for your organization',
        'Integration with your FHIR infrastructure',
        'Advanced security and compliance topics',
        'Dedicated Slack workspace',
        '1-year access to materials',
        'Post-training consultation sessions'
      ]
    };

    return features[sku as keyof typeof features] || [
      'Access to FHIR Healthcare Bootcamp',
      'Comprehensive learning materials',
      'Practical hands-on exercises'
    ];
  };

  const isPopular = (sku: string) => {
    return sku === 'FHIR-PRO';
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-catalog">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading course catalog...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">FHIR Healthcare Bootcamp</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Master healthcare interoperability with hands-on FHIR training
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>3-day intensive program</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span>Hands-on labs included</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>Industry-recognized curriculum</span>
            </div>
          </div>
        </div>

        {/* Course Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((product) => {
            const features = getProductFeatures(product.sku);
            const popular = isPopular(product.sku);
            const loading = loadingProduct === product.id;

            return (
              <Card 
                key={product.id} 
                className={`relative ${popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}
                data-testid={`product-card-${product.sku}`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <div className="text-3xl font-bold text-blue-600 my-2">
                    {formatPrice(product.price_cents)}
                  </div>
                  {product.description && (
                    <CardDescription className="text-base">
                      {product.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features List */}
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Free Trial Button (for subscription products) */}
                    {product.sku !== 'FHIR-BASIC' && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handlePurchase(product, 7)}
                        disabled={loading}
                        data-testid={`trial-btn-${product.sku}`}
                      >
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Start 7-Day Free Trial
                      </Button>
                    )}
                    
                    {/* Purchase Button */}
                    <Button 
                      className={`w-full ${popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      onClick={() => handlePurchase(product)}
                      disabled={loading}
                      data-testid={`buy-btn-${product.sku}`}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {product.sku === 'FHIR-BASIC' ? 'Buy Now' : 'Buy Full Access'}
                    </Button>
                  </div>

                  {/* Additional Info */}
                  <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                    <div className="mb-1">Secure payment powered by Stripe</div>
                    <div>30-day money-back guarantee</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Courses Available</h3>
            <p className="text-muted-foreground">
              Course packages are currently being configured. Please check back soon.
            </p>
          </div>
        )}

        {/* Authentication Notice */}
        {!user && (
          <div className="max-w-md mx-auto mt-12 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Sign In Required
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Please sign in with your account to purchase courses and access the bootcamp materials.
              </p>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What is included in the bootcamp?</h3>
              <p className="text-muted-foreground">
                Our 3-day intensive program covers FHIR data ingestion, transformation, analytics, and operationalization. 
                You'll work with real synthetic patient data and learn industry best practices.
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
              <h3 className="font-semibold mb-2">How do free trials work?</h3>
              <p className="text-muted-foreground">
                Free trials give you 7 days of full access to course materials. You can cancel anytime during the trial 
                without being charged. After the trial, you'll be billed for the full course.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}