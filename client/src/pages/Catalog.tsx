import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useAccess } from "@/hooks/useAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Loader2, Package, Star, Clock, CheckCircle, ExternalLink, BookOpen, Play, Calendar, Users, Award, Bell } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price_cents: number;
  stripe_price_id: string | null;
  is_active: boolean;
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
      'fhir-bootcamp-basic': [
        'Complete 3-day FHIR bootcamp curriculum',
        'Hands-on labs with synthetic data',
        'FHIR server setup and configuration',
        'Data ingestion and transformation',
        'Basic analytics and reporting',
        '30-day access to materials'
      ],
      'fhir-bootcamp-plus': [
        'Everything in Basic, plus:',
        'Advanced FHIR interoperability patterns',
        'Custom data transformation scripts',
        'Production-ready deployment guides',
        'BYOD (Bring Your Own Data) workshops',
        'Priority instructor support',
        '90-day access to materials',
        'Certificate of completion'
      ],
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
      ]
    };

    return features[sku as keyof typeof features] || [
      'Access to FHIR Healthcare Bootcamp',
      'Comprehensive learning materials',
      'Practical hands-on exercises'
    ];
  };

  const isPopular = (sku: string) => {
    return sku === 'FHIR-PRO' || sku === 'fhir-bootcamp-plus';
  };

  const FreeCourseCard = () => {
    const { canAccess, isLoading: accessLoading } = useAccess('fhir-101');
    
    return (
      <Card className="relative" data-testid="course-card-fhir-101">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-green-500 text-white px-3 py-1">
            <CheckCircle className="h-3 w-3 mr-1" />
            Free
          </Badge>
        </div>
        
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">FHIR 101</CardTitle>
          <div className="text-2xl font-bold text-green-600 my-2">
            Free
          </div>
          <CardDescription className="text-base">
            Master the basics of FHIR and healthcare data exchange
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {[
              'Introduction to FHIR concepts',
              'Resource navigation and structure',
              'Basic API operations',
              'Healthcare data exchange fundamentals',
              '4-6 hours of content'
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          <div className="pt-4 space-y-3">
            <Link href="/course/fhir-101">
              <Button className="w-full" variant="outline" data-testid="view-course-fhir-101">
                View Course Details
              </Button>
            </Link>
            
            {accessLoading ? (
              <Button className="w-full" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking Access...
              </Button>
            ) : canAccess ? (
              <Button className="w-full" data-testid="continue-fhir-101" onClick={() => window.location.href = "/course/fhir-101/start"}>
                <Play className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            ) : (
              <Button className="w-full" data-testid="enroll-fhir-101" onClick={() => window.location.href = "/course/fhir-101/start"}>
                <BookOpen className="h-4 w-4 mr-2" />
                Enroll Now (Free)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  interface PaidCourseCardProps {
    product: Product;
    courseSlug?: string;
    features: string[];
    popular: boolean;
    loading: boolean;
    onPurchase: (product: Product, trialDays?: number) => void;
  }

  const PaidCourseCard = ({ product, courseSlug, features, popular, loading, onPurchase }: PaidCourseCardProps) => {
    const { canAccess, reason, isLoading: accessLoading } = useAccess(courseSlug || '');
    
    const getCTAButtons = () => {
      if (accessLoading) {
        return (
          <Button className="w-full" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Checking Access...
          </Button>
        );
      }

      if (canAccess) {
        return (
          <Button 
            className="w-full" 
            onClick={() => window.location.href = `/course/${courseSlug}/start`}
            data-testid={`continue-${product.sku}`}
          >
            <Play className="h-4 w-4 mr-2" />
            {reason === 'trial_active' ? 'Continue Trial' : 'Continue Learning'}
          </Button>
        );
      }

      return (
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onPurchase(product, 7)}
            disabled={loading}
            data-testid={`trial-btn-${product.sku}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Start 7-Day Free Trial
          </Button>
          
          <Button 
            className={`w-full ${popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            onClick={() => onPurchase(product)}
            disabled={loading}
            data-testid={`buy-btn-${product.sku}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Enroll Now
          </Button>
        </div>
      );
    };

    return (
      <Card 
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
          <CardTitle className="text-xl">{product.name}</CardTitle>
          <div className="text-2xl font-bold text-blue-600 my-2">
            {formatPrice(product.price_cents)}
            <div className="text-sm text-gray-500 font-normal">
              7-day free trial
            </div>
          </div>
          {product.description && (
            <CardDescription className="text-base">
              {product.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            {features.slice(0, 5).map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {courseSlug && (
            <Link href={`/course/${courseSlug}`}>
              <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700" data-testid={`details-${product.sku}`}>
                View Full Syllabus & Details
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          )}

          {getCTAButtons()}

          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            <div className="mb-1">Secure payment powered by Stripe</div>
            <div>30-day money-back guarantee</div>
          </div>
        </CardContent>
      </Card>
    );
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
          <FreeCourseCard />
          
          {products.map((product) => {
            const features = getProductFeatures(product.sku);
            const popular = isPopular(product.sku);
            const loading = loadingProduct === product.id;
            
            const courseSlugMap = {
              'fhir-bootcamp-basic': 'health-data-bootcamp',
              'fhir-bootcamp-plus': 'fhir-deep-dive',
              'FHIR-BASIC': 'health-data-bootcamp',
              'FHIR-PRO': 'fhir-deep-dive'
            };
            const courseSlug = courseSlugMap[product.sku as keyof typeof courseSlugMap];

            return (
              <PaidCourseCard 
                key={product.id}
                product={product}
                courseSlug={courseSlug}
                features={features}
                popular={popular}
                loading={loading}
                onPurchase={handlePurchase}
              />
            );
          })}
        </div>

        {/* New 12-Week FHIR Bootcamp Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">12-Week FHIR Bootcamp for Data Engineers</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Comprehensive flipped classroom program with project-based learning
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>12 weeks intensive</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Flipped classroom model</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>Industry certification</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Week 1-4: Foundations */}
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="mb-2">Weeks 1-4</Badge>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">Healthcare Data Foundations</CardTitle>
                <CardDescription>
                  Master healthcare data landscape, HL7 v2.x, and FHIR fundamentals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Healthcare Data Landscape & Interoperability Challenges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>HL7 v2.x Deep Dive & Message Parsing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>FHIR R4 Fundamentals & Resource Architecture</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Core FHIR Resources & Relationships</span>
                  </li>
                </ul>
                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Hands-on Labs:</div>
                  <div className="text-sm">HAPI FHIR Server setup, Postman collections, HL7 parser development</div>
                </div>
              </CardContent>
            </Card>

            {/* Week 5-8: API Development */}
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="mb-2">Weeks 5-8</Badge>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">FHIR API & Data Pipelines</CardTitle>
                <CardDescription>
                  Build production-ready APIs and transformation pipelines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>FHIR RESTful API Patterns & Advanced Search</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>HAPI FHIR Server Customization & Deployment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Data Transformation & ETL Pipeline Development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Advanced FHIR Operations & Bulk Data Export</span>
                  </li>
                </ul>
                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Project Work:</div>
                  <div className="text-sm">Custom FHIR endpoints, HL7-to-FHIR transformation pipeline</div>
                </div>
              </CardContent>
            </Card>

            {/* Week 9-12: Production & Capstone */}
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="mb-2">Weeks 9-12</Badge>
                  <Award className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">Production & Capstone Projects</CardTitle>
                <CardDescription>
                  Security, DevOps, integration patterns, and industry showcase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Security & Compliance (HIPAA, OAuth 2.0, SMART on FHIR)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Production Deployment & DevOps Pipelines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Integration Patterns & Multi-vendor Connectivity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Capstone Project & Industry Showcase</span>
                  </li>
                </ul>
                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Deliverables:</div>
                  <div className="text-sm">Production FHIR system, industry presentation, certification</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Program Details */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-8">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-6 text-center">Program Highlights</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Learning Format</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Flipped Classroom:</strong> 3 hours pre-class content + 5 hours hands-on labs weekly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Project-Based:</strong> Real-world capstone projects with industry mentors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Tools Mastery:</strong> HAPI FHIR Server, Postman, Docker, CI/CD pipelines</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Capstone Options</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Hospital Data Lake Migration (Legacy HL7 to FHIR)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Real-time Clinical Dashboard Platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Multi-vendor FHIR Interoperability Hub</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Clinical Research Data Standardization Pipeline</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-blue-200 dark:border-blue-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">96 Hours</div>
                    <div className="text-sm text-muted-foreground">Total program duration</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">5 Projects</div>
                    <div className="text-sm text-muted-foreground">Hands-on capstone options</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">Industry Ready</div>
                    <div className="text-sm text-muted-foreground">Production deployment skills</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold mb-4">12-Week FHIR Bootcamp for Data Engineers</h3>
              <p className="text-muted-foreground mb-6">
                Comprehensive program launching Q2 2025. Join our waitlist to secure early bird pricing 
                and get notified when registration opens.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  data-testid="signup-12-week-bootcamp"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Join Waitlist & Sign Up
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 px-8"
                  data-testid="notify-12-week-bootcamp"
                >
                  <Bell className="h-5 w-5 mr-2" />
                  Be Notified When Live
                </Button>
              </div>

              <div className="mt-6 text-sm text-muted-foreground">
                <p className="mb-2"><strong>Early Bird Special:</strong> 25% off regular pricing for first 50 registrants</p>
                <p><strong>Launch Date:</strong> April 2025 | <strong>Duration:</strong> 12 weeks intensive</p>
              </div>
            </div>
          </div>
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