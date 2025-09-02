import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSessionStore } from "@/stores/sessionStore";
import { 
  Shield, 
  LogIn, 
  PlayCircle, 
  Sparkles, 
  Lock,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import SEOHead from "@/components/seo-head";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isEnteringDemo, setIsEnteringDemo] = useState(false);
  const { setUser, setProfile, setDemoMode } = useSessionStore();

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) {
      toast({
        title: "Authentication not configured",
        description: "Google sign-in is not available. Please try Demo Mode instead.",
        variant: "destructive"
      });
      return;
    }

    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/overview`
        }
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Redirecting to Google",
          description: "Please complete sign in with Google to continue.",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Authentication error",
        description: "Failed to initiate Google sign in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDemoMode = async () => {
    setIsEnteringDemo(true);
    try {
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

      // Redirect to overview
      setTimeout(() => {
        setLocation("/overview");
      }, 500);

    } catch (error) {
      toast({
        title: "Demo setup failed",
        description: "Failed to initialize demo mode. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnteringDemo(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <SEOHead 
        title="Sign In - FHIR Healthcare Bootcamp"
        description="Sign in to access your FHIR training portal or try our interactive demo"
      />
      
      {/* Header */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">FHIR Bootcamp</span>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Auth Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4">
        <div className="w-full max-w-md space-y-6">
          
          {/* Welcome Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to your FHIR training portal or explore with demo mode
            </p>
          </div>

          {/* Sign In Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LogIn className="h-5 w-5" />
                <span>Sign In</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Google Sign In */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || isEnteringDemo}
                className="w-full h-12"
                size="lg"
                data-testid="button-google-signin"
              >
                {isSigningIn ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </div>
                )}
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </div>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Demo Mode Card */}
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-primary">
                <PlayCircle className="h-5 w-5" />
                <span>Try Demo Mode</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Explore the full FHIR Bootcamp experience with sample data and progress. 
                No signup required!
              </p>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Pre-loaded course progress</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Interactive labs with synthetic data</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Sample certificates and badges</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Read-only billing features</span>
                </div>
              </div>

              <Button
                onClick={handleDemoMode}
                disabled={isSigningIn || isEnteringDemo}
                variant="outline"
                className="w-full h-12 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                size="lg"
                data-testid="button-demo-mode"
              >
                {isEnteringDemo ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Setting up demo...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Enter Demo Mode</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Help Text */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Need help?</strong> Contact our support team at{" "}
              <a 
                href="mailto:support@fhirbootcamp.com" 
                className="text-primary hover:underline"
              >
                support@fhirbootcamp.com
              </a>{" "}
              or try our demo mode to explore the platform first.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}