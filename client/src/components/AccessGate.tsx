import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { StartTrialCta } from "@/components/common/CtaButton";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/stores/sessionStore";
import { 
  Loader2, 
  Lock, 
  ShoppingCart, 
  Clock, 
  CreditCard, 
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Eye,
  Play
} from "lucide-react";

interface AccessGateProps {
  courseSlug: string;
  children: React.ReactNode;
  courseName?: string;
}

export default function AccessGate({ courseSlug, children, courseName }: AccessGateProps) {
  const { user } = useAuth();
  const { canAccess, reason, isLoading } = useAccess(courseSlug);
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { setDemoMode, setUser, setProfile } = useSessionStore();

  // Get billing portal mutation
  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/billing/portal');
      return response;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error) => {
      toast({
        title: "Portal Error",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setLoadingAction(null);
    }
  });

  const handleBillingPortal = () => {
    setLoadingAction('portal');
    portalMutation.mutate();
  };

  // Demo mode activation
  const handleDemoMode = async () => {
    try {
      setLoadingAction('demo');
      
      // Create mock demo user
      const demoUser = {
        id: 'demo-user-123',
        email: 'demo@fhirbootcamp.com',
        user_metadata: {
          full_name: 'Demo User',
          avatar_url: null
        }
      };

      // Create mock demo profile with synthetic progress
      const demoProfile = {
        id: 'demo-user-123',
        email: 'demo@fhirbootcamp.com',
        full_name: 'Demo User',
        avatar_url: null,
        role: 'student' as const,
        fhir_points: 750,
        created_at: '2024-01-01T00:00:00Z'
      };

      // Set demo mode in session store and localStorage
      setDemoMode(true);
      setUser(demoUser);
      setProfile(demoProfile);
      localStorage.setItem('demo-mode', 'true');

      // Generate synthetic lab progress
      await generateDemoProgress();

      toast({
        title: "Demo Mode Activated",
        description: "Welcome to the FHIR Bootcamp demo! Explore all features with sample data.",
        variant: "default"
      });

      // Refresh the page to trigger access check with demo mode
      window.location.reload();

    } catch (error) {
      console.error('Error activating demo mode:', error);
      toast({
        title: "Demo Mode Error", 
        description: "Failed to activate demo mode. Please try again.",
        variant: "destructive"
      });
      setLoadingAction(null);
    }
  };

  // Generate demo progress data
  const generateDemoProgress = async () => {
    // Simulate API call to create demo progress
    const demoProgressData = [
      // Day 1 Progress
      { labDay: 1, stepName: 'server_setup', completed: true, completedAt: '2024-01-01T10:00:00Z' },
      { labDay: 1, stepName: 'bundle_upload', completed: true, completedAt: '2024-01-01T10:30:00Z' },
      { labDay: 1, stepName: 'resource_exploration', completed: true, completedAt: '2024-01-01T11:00:00Z' },
      
      // Day 2 Progress  
      { labDay: 2, stepName: 'data_export', completed: true, completedAt: '2024-01-02T10:00:00Z' },
      { labDay: 2, stepName: 'sql_transformation', completed: true, completedAt: '2024-01-02T11:00:00Z' },
      { labDay: 2, stepName: 'risk_calculation', completed: false },
      
      // Day 3 Progress
      { labDay: 3, stepName: 'observation_creation', completed: false },
      { labDay: 3, stepName: 'fhir_publishing', completed: false },
      { labDay: 3, stepName: 'mini_app_sharing', completed: false }
    ];

    // Store in localStorage for demo mode
    localStorage.setItem('demo-lab-progress', JSON.stringify(demoProgressData));
    
    // Also store demo quiz attempts
    const demoQuizData = [
      { 
        quizId: 'day1-quiz', 
        score: 8, 
        totalQuestions: 8, 
        completedAt: '2024-01-01T12:00:00Z',
        passed: true
      },
      { 
        quizId: 'day2-quiz', 
        score: 7, 
        totalQuestions: 10, 
        completedAt: '2024-01-02T12:00:00Z',
        passed: true
      }
    ];
    
    localStorage.setItem('demo-quiz-attempts', JSON.stringify(demoQuizData));

    // Store demo certificates
    const demoCertificates = [
      {
        id: 'cert-day1',
        course_name: 'FHIR Data Ingestion Mastery',
        issued_date: '2024-01-01T12:00:00Z',
        certificate_url: '/demo/certificates/day1.pdf'
      }
    ];
    
    localStorage.setItem('demo-certificates', JSON.stringify(demoCertificates));

    // Store demo badges
    const demoBadges = [
      {
        id: 'badge-first-bundle',
        title: 'First Bundle Upload',
        description: 'Successfully uploaded your first FHIR bundle',
        icon: '🎯',
        earned_date: '2024-01-01T10:30:00Z'
      },
      {
        id: 'badge-data-explorer',
        title: 'Data Explorer',
        description: 'Explored patient resources and relationships',
        icon: '🔍',
        earned_date: '2024-01-01T11:00:00Z'
      },
      {
        id: 'badge-quiz-ace',
        title: 'Quiz Ace',
        description: 'Perfect score on Day 1 quiz',
        icon: '🏆',
        earned_date: '2024-01-01T12:00:00Z'
      }
    ];
    
    localStorage.setItem('demo-badges', JSON.stringify(demoBadges));
  };

  // If access is granted, render children
  if (canAccess) {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-lg">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Checking access permissions...</span>
        </div>
      </div>
    );
  }

  // Access denied - show appropriate CTA based on reason
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="border-2">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 p-3 bg-orange-100 dark:bg-orange-950 rounded-full w-fit">
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl mb-2">
              Access Required
            </CardTitle>
            <CardDescription className="text-base">
              {courseName ? `Access to "${courseName}"` : 'This course content'} requires an active subscription or purchase.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Access Status */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Access Status:</span>
                <AccessStatusBadge reason={reason} />
              </div>
              <AccessReasonText reason={reason} />
            </div>

            {/* Actions based on access reason */}
            <div className="space-y-4">
              {reason === 'not_authenticated' && (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Please sign in to check your course access and purchases.
                  </p>
                  <div className="space-y-3">
                    <Link href="/auth">
                      <Button size="lg" className="w-full">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Sign In to Continue
                      </Button>
                    </Link>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or try our demo
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                      onClick={handleDemoMode}
                      disabled={loadingAction === 'demo'}
                      data-testid="demo-mode-button"
                    >
                      {loadingAction === 'demo' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      Try Demo Mode
                    </Button>
                    
                    <p className="text-xs text-muted-foreground">
                      Demo mode provides full access to course content with sample data. No account required.
                    </p>
                  </div>
                </div>
              )}

              {reason === 'no_purchase' && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-center">
                    Start your free trial to access this premium content.
                  </p>
                  <div className="space-y-3">
                    <StartTrialCta size="lg" className="w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Link href="/catalog">
                        <Button size="lg" className="w-full" variant="outline">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Browse Packages
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full"
                        onClick={handleBillingPortal}
                        disabled={loadingAction === 'portal'}
                    >
                      {loadingAction === 'portal' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Check Billing
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {reason === 'trial_expired' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-amber-800 dark:text-amber-200">
                        Trial Expired
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Your free trial has ended. Upgrade to continue accessing course materials.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={handleBillingPortal}
                      disabled={loadingAction === 'portal'}
                    >
                      {loadingAction === 'portal' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Upgrade Subscription
                    </Button>
                    <Link href="/catalog">
                      <Button variant="outline" size="lg" className="w-full">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        View Packages
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {reason === 'error' && (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    There was an error checking your access. Please try refreshing the page.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </Button>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="pt-6 border-t">
              <h3 className="font-medium mb-3">Need Help?</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• Check your email for purchase confirmations</div>
                <div>• Visit the billing portal to manage subscriptions</div>
                <div>• Contact support if you believe this is an error</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AccessStatusBadge({ reason }: { reason: string }) {
  const statusConfig = {
    not_authenticated: { label: 'Not Signed In', variant: 'secondary' as const },
    no_purchase: { label: 'No Access', variant: 'destructive' as const },
    trial_expired: { label: 'Trial Expired', variant: 'outline' as const },
    error: { label: 'Error', variant: 'destructive' as const },
    loading: { label: 'Checking...', variant: 'secondary' as const }
  };

  const config = statusConfig[reason as keyof typeof statusConfig] || {
    label: 'Access Denied',
    variant: 'destructive' as const
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function AccessReasonText({ reason }: { reason: string }) {
  const reasonTexts = {
    not_authenticated: 'You need to sign in to access course content.',
    no_purchase: 'This content requires a valid course purchase or active subscription.',
    trial_expired: 'Your free trial period has ended. Upgrade to continue learning.',
    error: 'Unable to verify your access permissions at this time.',
    loading: 'Verifying your access permissions...'
  };

  return (
    <p className="text-sm text-muted-foreground">
      {reasonTexts[reason as keyof typeof reasonTexts] || 'Access to this content is restricted.'}
    </p>
  );
}