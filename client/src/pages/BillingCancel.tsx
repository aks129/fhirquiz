import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function BillingCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        
        {/* Cancel Header */}
        <Card className="mb-8">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              <XCircle className="h-12 w-12 text-orange-500" />
            </div>
            <CardTitle className="text-3xl mb-2 text-orange-700 dark:text-orange-300">
              Purchase Cancelled
            </CardTitle>
            <CardDescription className="text-base">
              Your checkout session was cancelled and no payment was processed.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* What Happened */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What Happened?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-orange-800 dark:text-orange-200">
                You cancelled the checkout process before completing your purchase. 
                No charges have been made to your payment method.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Common reasons for cancellation:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Clicked the back button or closed the checkout window</li>
                <li>• Decided to review course details before purchasing</li>
                <li>• Payment method issues or questions</li>
                <li>• Wanted to compare different course packages</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What Would You Like to Do?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/catalog">
                <Button className="w-full" size="lg">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </Link>
              
              <Link href="/overview">
                <Button variant="outline" className="w-full" size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Learn More About Courses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              We're here to assist you with any questions about our courses or the purchase process.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-1">Questions about course content?</h4>
                <p className="text-sm text-muted-foreground">
                  Review our detailed course overview and curriculum breakdown.
                </p>
                <Link href="/overview">
                  <Button variant="link" className="p-0 h-auto mt-2">
                    View Course Details →
                  </Button>
                </Link>
              </div>
              
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-1">Payment or billing questions?</h4>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards and offer flexible payment options.
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-1">Technical issues?</h4>
                <p className="text-sm text-muted-foreground">
                  Contact our support team if you experienced any technical problems during checkout.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Your data is secure and no payment information was stored during the cancelled session.
          </p>
        </div>
      </div>
    </div>
  );
}