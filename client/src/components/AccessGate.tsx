import { useState } from "react";
import { Link } from "wouter";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Lock, 
  ShoppingCart, 
  Clock, 
  CreditCard, 
  ExternalLink,
  BookOpen,
  AlertTriangle
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
                  <Button size="lg" className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Sign In to Continue
                  </Button>
                </div>
              )}

              {reason === 'no_purchase' && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-center">
                    Purchase a course package to access this content.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Link href="/catalog">
                      <Button size="lg" className="w-full">
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