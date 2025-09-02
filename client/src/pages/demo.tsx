import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, PlayCircle, Users, Database, BarChart3, Smartphone, ArrowRight, RefreshCw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface DemoInitResponse {
  success: boolean;
  message: string;
  sessionId: string;
  instructions: string;
}

export default function DemoPage() {
  const [demoSessionId, setDemoSessionId] = useState<string | null>(null);

  const initializeMutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/demo/initialize", {
        method: "POST",
        body: JSON.stringify({ sessionId: "demo-session-123" })
      }),
    onSuccess: (result: DemoInitResponse) => {
      setDemoSessionId(result.sessionId);
    }
  });

  const demoFeatures = [
    {
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      title: "Complete Lab Progress",
      description: "All 3 days completed with realistic progress and artifacts",
      path: "/overview",
      badge: "Days 1-3"
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: "Quiz Results",
      description: "High-scoring quiz attempts across all knowledge areas",
      path: "/quiz/day1",
      badge: "4 Quizzes"
    },
    {
      icon: <Database className="w-6 h-6 text-purple-600" />,
      title: "FHIR Bundles & Data",
      description: "Sample Synthea patient data uploaded and processed",
      path: "/lab/day1",
      badge: "156 Resources"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-orange-600" />,
      title: "SQL Transformations",
      description: "Risk analysis queries and patient scoring algorithms",
      path: "/lab/day2",
      badge: "5 Queries"
    },
    {
      icon: <Smartphone className="w-6 h-6 text-pink-600" />,
      title: "BYOD Mini-Apps",
      description: "Personal health dashboards and trend analyzers",
      path: "/byod",
      badge: "2 Apps"
    }
  ];

  const renderIntroduction = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🎭 Demo Mode</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience the complete FHIR Healthcare Bootcamp with pre-populated sample data 
          showcasing all features and a realistic user journey.
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <PlayCircle className="h-4 w-4" />
        <AlertDescription className="text-blue-900">
          <strong>Demo Features:</strong> This mode creates a comprehensive sample environment 
          with completed labs, quiz results, FHIR data, and BYOD applications. Perfect for 
          exploring all features without going through the full bootcamp process.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">🚀 Initialize Demo Environment</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Click below to create a complete sample environment with realistic data across all bootcamp features.
          </p>
          <Button 
            size="lg" 
            onClick={() => initializeMutation.mutate()}
            disabled={initializeMutation.isPending}
            className="px-8"
            data-testid="button-initialize-demo"
          >
            {initializeMutation.isPending ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Initializing Demo...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5 mr-2" />
                Initialize Demo Environment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoFeatures.map((feature, index) => (
          <Card key={index} className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
              <Badge variant="secondary">{feature.badge}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDemoReady = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">✅ Demo Ready!</h1>
        <p className="text-xl text-muted-foreground">
          Your demo environment is initialized with sample data. Explore all features below.
        </p>
      </div>

      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="text-green-900">
          <strong>Demo Session ID:</strong> <code className="bg-green-100 px-2 py-1 rounded text-sm">{demoSessionId}</code>
          <br />
          All features are now accessible with realistic sample data. Navigate through the bootcamp to see completed progress.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-1 gap-6">
        {demoFeatures.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {feature.icon}
                  <div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary">{feature.badge}</Badge>
                  <Link href={feature.path}>
                    <Button size="sm" data-testid={`button-explore-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      Explore
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-3">🎯 Recommended Demo Flow</h3>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <Badge variant="outline">1. Overview Progress</Badge>
            <Badge variant="outline">2. Lab Exercises</Badge>
            <Badge variant="outline">3. Quiz Results</Badge>
            <Badge variant="outline">4. BYOD Features</Badge>
            <Badge variant="outline">5. Mini-Apps</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Start with the Overview to see completed progress, then explore each lab day and BYOD features.
          </p>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          variant="outline"
          onClick={() => {
            setDemoSessionId(null);
            window.location.reload();
          }}
          data-testid="button-reset-demo"
        >
          Reset Demo Environment
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {!demoSessionId ? renderIntroduction() : renderDemoReady()}
    </div>
  );
}