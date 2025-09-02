import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Clock, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface TrialStatus {
  isTrialing: boolean;
  daysRemaining: number;
  trialEndDate: string;
}

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);
  
  // Get trial status for current user
  const { data: trialStatus } = useQuery<TrialStatus>({
    queryKey: ['/api/billing/trial-status'],
    retry: false
  });

  // Only show banner if user is trialing and has 7 or fewer days left
  if (!trialStatus?.isTrialing || trialStatus.daysRemaining > 7 || dismissed) {
    return null;
  }

  const isUrgent = trialStatus.daysRemaining <= 3;

  return (
    <Alert className={`mb-4 ${isUrgent ? 'border-destructive bg-destructive/5' : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'}`}>
      <Clock className={`h-4 w-4 ${isUrgent ? 'text-destructive' : 'text-amber-600'}`} />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className={`font-medium ${isUrgent ? 'text-destructive' : 'text-amber-800 dark:text-amber-200'}`}>
            {trialStatus.daysRemaining === 1 
              ? "Your trial expires tomorrow!" 
              : `Your trial expires in ${trialStatus.daysRemaining} days`
            }
          </span>
          <span className="ml-2 text-muted-foreground">
            Upgrade now to keep access to all bootcamp content and features.
          </span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Link href="/pricing">
            <Button 
              size="sm" 
              variant={isUrgent ? "destructive" : "default"}
              data-testid="trial-banner-upgrade"
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            data-testid="trial-banner-dismiss"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}