import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, CreditCard, ExternalLink, ArrowRight } from "lucide-react";

interface CheckoutSession {
  id: string;
  payment_status: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  subscription_id: string | null;
  payment_intent_id: string | null;
}

export default function BillingSuccess() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Extract session_id from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('session_id');
    setSessionId(id);
  }, [location]);

  // Fetch session details
  const { data: session, isLoading, error } = useQuery<CheckoutSession>({
    queryKey: ['/api/billing/session', sessionId],
    enabled: !!sessionId,
    retry: false
  });

  // Get billing portal link mutation
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
    }
  });

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(cents / 100);
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'unpaid':
        return <CreditCard className="h-8 w-8 text-orange-500" />;
      default:
        return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payment Successful';
      case 'unpaid':
        return 'Payment Pending';
      default:
        return 'Processing Payment';
    }
  };

  const getPaymentStatusDescription = (status: string, isSubscription: boolean) => {
    switch (status) {
      case 'paid':
        return isSubscription 
          ? 'Your subscription is now active and you have full access to the bootcamp materials.'
          : 'Your purchase was successful and you now have access to the bootcamp materials.';
      case 'unpaid':
        return 'Your payment is being processed. You will receive email confirmation once complete.';
      default:
        return 'Please wait while we process your payment...';
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Session</CardTitle>
            <CardDescription>
              No checkout session found. Please try purchasing again.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/catalog">
              <Button>Return to Catalog</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Retrieving your purchase details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>
              Unable to retrieve your purchase details. Please contact support if the issue persists.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/catalog">
              <Button>Return to Catalog</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSubscription = !!session.subscription_id;
  const isPaid = session.payment_status === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        
        {/* Success Header */}
        <Card className="mb-8">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              {getPaymentStatusIcon(session.payment_status)}
            </div>
            <CardTitle className="text-3xl mb-2">
              {getPaymentStatusText(session.payment_status)}
            </CardTitle>
            <CardDescription className="text-base">
              {getPaymentStatusDescription(session.payment_status, isSubscription)}
            </CardDescription>
          </CardHeader>
          
          {/* Payment Details */}
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Amount Paid:</span>
                <span className="text-lg font-bold">
                  {formatPrice(session.amount_total, session.currency)}
                </span>
              </div>
              
              {session.customer_email && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Email:</span>
                  <span>{session.customer_email}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Payment Type:</span>
                <Badge variant={isSubscription ? "default" : "secondary"}>
                  {isSubscription ? "Subscription" : "One-time Payment"}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Session ID:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {session.id}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPaid ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Access Granted</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      You now have full access to the FHIR Healthcare Bootcamp materials.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/lab/day1">
                    <Button className="w-full" size="lg">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Start Day 1 Labs
                    </Button>
                  </Link>
                  
                  <Link href="/overview">
                    <Button variant="outline" className="w-full" size="lg">
                      View Course Overview
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <CreditCard className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">Payment Processing</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Your payment is being processed. Access will be granted once payment is confirmed.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Management */}
        {isPaid && isSubscription && (
          <Card>
            <CardHeader>
              <CardTitle>Billing Management</CardTitle>
              <CardDescription>
                Manage your subscription, update payment methods, and view billing history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                className="w-full"
              >
                {portalMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Go to Billing Portal
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Support */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Questions about your purchase? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}