import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Lock, Play, UserPlus } from "lucide-react";

interface CtaButtonProps {
  variant?: "trial" | "account" | "demo" | "upgrade" | "enroll";
  size?: "sm" | "default" | "lg";
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function CtaButton({ 
  variant = "trial", 
  size = "default", 
  className = "",
  disabled = false,
  children 
}: CtaButtonProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Check if in demo mode (mock purchase in localStorage)
  const isInDemoMode = localStorage.getItem('mockPurchases') !== null;

  const getButtonConfig = () => {
    switch (variant) {
      case "trial":
        return {
          text: children || "Start Free Trial",
          icon: <Play className="h-4 w-4 mr-2" />,
          action: () => setLocation("/auth"),
          demoTooltip: "Trial registration is disabled in demo mode. This would normally take you to the sign-up flow.",
          userTooltip: "You're already signed in! Visit your portal to access premium features."
        };
      case "account":
        return {
          text: children || "Create Free Account",
          icon: <UserPlus className="h-4 w-4 mr-2" />,
          action: () => setLocation("/auth"),
          demoTooltip: "Account creation is disabled in demo mode. This would normally take you to the registration form.",
          userTooltip: "You already have an account! Visit your portal to access features."
        };
      case "demo":
        return {
          text: children || "Continue in Demo Mode",
          icon: <Play className="h-4 w-4 mr-2" />,
          action: () => setLocation("/demo"),
          demoTooltip: "Continue exploring the demo experience",
          userTooltip: "Continue exploring the demo experience"
        };
      case "upgrade":
        return {
          text: children || "Upgrade Now",
          icon: <Lock className="h-4 w-4 mr-2" />,
          action: () => user ? setLocation("/billing") : setLocation("/auth"),
          demoTooltip: "Billing is simulated in demo mode. This would normally take you to the payment flow.",
          userTooltip: "Upgrade your account to access premium features"
        };
      case "enroll":
        return {
          text: children || "Enroll Now",
          icon: <UserPlus className="h-4 w-4 mr-2" />,
          action: () => user ? setLocation("/billing") : setLocation("/auth"),
          demoTooltip: "Enrollment is simulated in demo mode. This would normally take you to the payment flow.",
          userTooltip: "Enroll in the course to access all content"
        };
      default:
        return {
          text: children || "Get Started",
          icon: <Play className="h-4 w-4 mr-2" />,
          action: () => setLocation("/auth"),
          demoTooltip: "This action is disabled in demo mode",
          userTooltip: "Take action to proceed"
        };
    }
  };

  const config = getButtonConfig();
  const shouldDisable = disabled || (isInDemoMode && (variant === "trial" || variant === "account" || variant === "upgrade" || variant === "enroll"));
  const tooltipText = isInDemoMode ? config.demoTooltip : (user && (variant === "trial" || variant === "account") ? config.userTooltip : "");

  const buttonElement = (
    <Button
      size={size}
      className={className}
      onClick={config.action}
      disabled={shouldDisable}
      data-testid={`cta-${variant}`}
      variant={variant === "demo" ? "outline" : "default"}
    >
      {config.icon}
      {config.text}
    </Button>
  );

  if (tooltipText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonElement}
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonElement;
}

// Specific CTA components for common use cases
export function StartTrialCta({ className = "", size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  return <CtaButton variant="trial" className={className} size={size} />;
}

export function CreateAccountCta({ className = "", size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  return <CtaButton variant="account" className={className} size={size} />;
}

export function DemoModeCta({ className = "", size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  return <CtaButton variant="demo" className={className} size={size} />;
}

export function UpgradeCta({ className = "", size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  return <CtaButton variant="upgrade" className={className} size={size} />;
}

export function EnrollCta({ className = "", size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  return <CtaButton variant="enroll" className={className} size={size} />;
}