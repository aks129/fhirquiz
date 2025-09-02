import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, ArrowLeft, Server, FlaskConical, Eye } from "lucide-react";

interface OnboardingTourProps {
  onComplete: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight: string;
  action?: {
    label: string;
    href: string;
  };
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TourStep[] = [
    {
      id: 'server-selector',
      title: 'Choose Your FHIR Server',
      description: 'Start by selecting a FHIR test server. We recommend the Local HAPI server for beginners, or choose from public test servers for different scenarios.',
      icon: <Server className="w-6 h-6" />,
      highlight: 'Server Setup',
      action: {
        label: 'Go to Server Setup',
        href: '/bootcamp?step=server-setup'
      }
    },
    {
      id: 'labs',
      title: 'Complete Interactive Labs',
      description: 'Work through hands-on labs that teach FHIR data ingestion, transformation, and operationalization. Each lab builds on the previous one.',
      icon: <FlaskConical className="w-6 h-6" />,
      highlight: 'FHIR Labs',
      action: {
        label: 'Start Day 1 Lab',
        href: '/bootcamp/day1'
      }
    },
    {
      id: 'results-gallery',
      title: 'View Your Results',
      description: 'See all your lab outputs, generated reports, and FHIR observations in one place. Track your progress and showcase your work.',
      icon: <Eye className="w-6 h-6" />,
      highlight: 'Results Gallery',
      action: {
        label: 'View Gallery',
        href: '/gallery'
      }
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="onboarding-tour">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              Step {currentStep + 1} of {steps.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleSkip} data-testid="skip-tour">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
              {currentStepData.icon}
            </div>
            <div>
              <CardTitle className="text-xl" data-testid={`tour-step-title-${currentStepData.id}`}>
                {currentStepData.title}
              </CardTitle>
              <CardDescription className="font-medium text-blue-600 dark:text-blue-400">
                {currentStepData.highlight}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed" data-testid={`tour-step-description-${currentStepData.id}`}>
            {currentStepData.description}
          </p>

          {currentStepData.action && (
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                window.location.href = currentStepData.action!.href;
                onComplete();
              }}
              data-testid={`tour-action-${currentStepData.id}`}
            >
              {currentStepData.action.label}
            </Button>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button 
              variant="ghost" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
              data-testid="tour-previous"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext} data-testid="tour-next">
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}