import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CtaButton, EnrollCta, UpgradeCta } from "./CtaButton";
import { X, Clock, Users, Award, Star } from "lucide-react";

interface StickyFooterCtaProps {
  title?: string;
  price?: string;
  originalPrice?: string;
  features?: string[];
  discount?: string;
  urgency?: string;
  testimonial?: {
    text: string;
    author: string;
    role: string;
  };
  variant?: "enroll" | "upgrade";
  onDismiss?: () => void;
}

export function StickyFooterCta({
  title = "FHIR Healthcare Bootcamp",
  price = "$299",
  originalPrice = "$499",
  features = ["3-Day Intensive Training", "Hands-on Labs", "Industry Certificate", "Lifetime Access"],
  discount = "40% OFF",
  urgency = "Limited Time Offer",
  testimonial = {
    text: "This bootcamp transformed how I handle healthcare data integration.",
    author: "Dr. Sarah Chen",
    role: "Healthcare IT Director"
  },
  variant = "enroll",
  onDismiss
}: StickyFooterCtaProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useAuth();

  // Check if user has already purchased (mock or real)
  const hasPurchased = localStorage.getItem('mockPurchases') !== null || user?.subscription;

  // Auto-hide after user interaction or if already purchased
  useEffect(() => {
    if (hasPurchased) {
      setIsVisible(false);
    }
  }, [hasPurchased]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
    // Remember dismissal for session
    sessionStorage.setItem('ctaDismissed', 'true');
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Don't show if dismissed or if user already has access
  if (!isVisible || hasPurchased) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4" data-testid="sticky-footer-cta">
      <Card className="max-w-6xl mx-auto bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white border-0 shadow-2xl">
        <CardContent className={`p-4 transition-all duration-300 ${isMinimized ? 'py-2' : 'py-4'}`}>
          {/* Minimized View */}
          {isMinimized ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-yellow-500 text-yellow-900 font-bold">
                  {discount}
                </Badge>
                <div>
                  <h3 className="font-bold text-lg">{title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{price}</span>
                    <span className="text-sm line-through text-blue-200">{originalPrice}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {variant === "enroll" ? (
                  <EnrollCta size="lg" className="bg-white text-blue-800 hover:bg-blue-50" />
                ) : (
                  <UpgradeCta size="lg" className="bg-white text-blue-800 hover:bg-blue-50" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="text-blue-200 hover:text-white"
                >
                  Expand
                </Button>
              </div>
            </div>
          ) : (
            /* Full View */
            <div className="space-y-4">
              {/* Header with dismiss */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-yellow-500 text-yellow-900 font-bold animate-pulse">
                    {discount}
                  </Badge>
                  <Badge variant="outline" className="border-blue-300 text-blue-100">
                    <Clock className="h-3 w-3 mr-1" />
                    {urgency}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMinimize}
                    className="text-blue-200 hover:text-white"
                  >
                    Minimize
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-blue-200 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                {/* Course Info */}
                <div className="lg:col-span-1">
                  <h3 className="font-bold text-xl mb-2">{title}</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold">{price}</span>
                    <span className="text-lg line-through text-blue-200">{originalPrice}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-200 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>4.9/5 (1,247 reviews)</span>
                  </div>
                </div>

                {/* Features */}
                <div className="lg:col-span-1">
                  <h4 className="font-semibold mb-2 text-blue-100">What's Included:</h4>
                  <ul className="space-y-1 text-sm text-blue-100">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Award className="h-3 w-3 text-yellow-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Testimonial */}
                <div className="lg:col-span-1">
                  <div className="bg-blue-800/50 rounded-lg p-3">
                    <blockquote className="text-sm italic text-blue-100 mb-2">
                      "{testimonial.text}"
                    </blockquote>
                    <div className="text-xs text-blue-200">
                      <div className="font-semibold">{testimonial.author}</div>
                      <div>{testimonial.role}</div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="lg:col-span-1 flex flex-col gap-3">
                  {variant === "enroll" ? (
                    <EnrollCta size="lg" className="bg-white text-blue-800 hover:bg-blue-50 w-full">
                      Enroll Now - {price}
                    </EnrollCta>
                  ) : (
                    <UpgradeCta size="lg" className="bg-white text-blue-800 hover:bg-blue-50 w-full">
                      Upgrade Now - {price}
                    </UpgradeCta>
                  )}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-blue-200">
                      <Users className="h-3 w-3" />
                      <span>2,847 students enrolled this month</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}