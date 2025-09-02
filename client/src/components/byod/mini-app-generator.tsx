import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, LineChart, TrendingUp, Settings, Palette, Layout, Zap } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MiniAppGeneratorProps {
  byodSessionId: string;
  availableMetrics: string[];
  onComplete: (appId: string, appUrl: string) => void;
}

type AppType = "dashboard" | "trends" | "insights" | "custom";
type ChartType = "line" | "bar" | "area" | "pie";
type LayoutType = "grid" | "single" | "tabs";

interface AppConfig {
  theme: "light" | "dark";
  charts: Array<{
    type: ChartType;
    metric: string;
    title?: string;
    timeRange?: string;
  }>;
  layout: LayoutType;
  features: string[];
}

export function MiniAppGenerator({ byodSessionId, availableMetrics, onComplete }: MiniAppGeneratorProps) {
  const [appName, setAppName] = useState("");
  const [appType, setAppType] = useState<AppType>("dashboard");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [customConfig, setCustomConfig] = useState<Partial<AppConfig>>({
    theme: "light",
    layout: "grid",
    features: []
  });
  const [currentStep, setCurrentStep] = useState<"type" | "config" | "preview">("type");

  const generateAppMutation = useMutation({
    mutationFn: async (data: {
      byodSessionId: string;
      appName: string;
      appType: string;
      metrics: string[];
      config: Partial<AppConfig>;
    }) =>
      apiRequest("/api/byod/generate-app", {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: (result: { appId: string; appUrl: string }) => {
      onComplete(result.appId, result.appUrl);
    }
  });

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleFeatureToggle = (feature: string) => {
    setCustomConfig(prev => ({
      ...prev,
      features: prev.features?.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...(prev.features || []), feature]
    }));
  };

  const generateApp = () => {
    if (!appName || selectedMetrics.length === 0) return;

    generateAppMutation.mutate({
      byodSessionId,
      appName,
      appType,
      metrics: selectedMetrics,
      config: customConfig
    });
  };

  const renderAppTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your App Type</h2>
        <p className="text-muted-foreground">
          Select the type of mini-app you want to create
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${appType === 'dashboard' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setAppType('dashboard')}
          data-testid="app-type-dashboard"
        >
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Health Dashboard</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comprehensive overview with multiple charts and KPIs
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              <Badge variant="secondary" className="text-xs">Multi-metric</Badge>
              <Badge variant="secondary" className="text-xs">Real-time</Badge>
              <Badge variant="secondary" className="text-xs">Interactive</Badge>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${appType === 'trends' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setAppType('trends')}
          data-testid="app-type-trends"
        >
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold mb-2">Trend Analyzer</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Deep dive into patterns and long-term trends
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              <Badge variant="secondary" className="text-xs">Pattern detection</Badge>
              <Badge variant="secondary" className="text-xs">Predictions</Badge>
              <Badge variant="secondary" className="text-xs">Analytics</Badge>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${appType === 'insights' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setAppType('insights')}
          data-testid="app-type-insights"
        >
          <CardContent className="p-6 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h3 className="text-lg font-semibold mb-2">Insight Generator</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered insights and recommendations
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              <Badge variant="secondary" className="text-xs">Recommendations</Badge>
              <Badge variant="secondary" className="text-xs">Anomalies</Badge>
              <Badge variant="secondary" className="text-xs">Goals</Badge>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${appType === 'custom' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setAppType('custom')}
          data-testid="app-type-custom"
        >
          <CardContent className="p-6 text-center">
            <Settings className="w-12 h-12 mx-auto mb-4 text-orange-600" />
            <h3 className="text-lg font-semibold mb-2">Custom App</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Build a personalized app with custom features
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              <Badge variant="secondary" className="text-xs">Flexible</Badge>
              <Badge variant="secondary" className="text-xs">Configurable</Badge>
              <Badge variant="secondary" className="text-xs">Unique</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button 
          onClick={() => setCurrentStep("config")}
          disabled={!appType}
          data-testid="button-next-to-config"
        >
          Continue to Configuration
        </Button>
      </div>
    </div>
  );

  const renderConfiguration = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Configure Your App</h2>
        <p className="text-muted-foreground">
          Customize your {appType} with specific metrics and features
        </p>
      </div>

      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basics" data-testid="tab-basics">Basics</TabsTrigger>
          <TabsTrigger value="metrics" data-testid="tab-metrics">Metrics</TabsTrigger>
          <TabsTrigger value="features" data-testid="tab-features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="app-name">App Name</Label>
                <Input
                  id="app-name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="My Health Dashboard"
                  data-testid="input-app-name"
                />
              </div>

              <div>
                <Label>Theme</Label>
                <Select 
                  value={customConfig.theme} 
                  onValueChange={(value: "light" | "dark") => 
                    setCustomConfig(prev => ({ ...prev, theme: value }))
                  }
                >
                  <SelectTrigger data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Layout Style</Label>
                <Select 
                  value={customConfig.layout} 
                  onValueChange={(value: LayoutType) => 
                    setCustomConfig(prev => ({ ...prev, layout: value }))
                  }
                >
                  <SelectTrigger data-testid="select-layout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid Layout</SelectItem>
                    <SelectItem value="single">Single Column</SelectItem>
                    <SelectItem value="tabs">Tabbed Interface</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Health Metrics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose which metrics to include in your app
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableMetrics.map((metric) => (
                  <div key={metric} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric}
                      checked={selectedMetrics.includes(metric)}
                      onCheckedChange={() => handleMetricToggle(metric)}
                      data-testid={`checkbox-metric-${metric}`}
                    />
                    <Label htmlFor={metric} className="text-sm">{metric}</Label>
                  </div>
                ))}
              </div>
              {selectedMetrics.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Selected metrics:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedMetrics.map((metric) => (
                      <Badge key={metric} variant="outline" className="text-xs">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>App Features</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enable additional features for your app
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'export', label: 'Data Export', desc: 'Export charts and data' },
                  { id: 'share', label: 'Sharing', desc: 'Share app with others' },
                  { id: 'filters', label: 'Advanced Filters', desc: 'Time range and data filters' },
                  { id: 'notifications', label: 'Notifications', desc: 'Alerts and reminders' },
                  { id: 'goals', label: 'Goal Tracking', desc: 'Set and track health goals' },
                  { id: 'insights', label: 'AI Insights', desc: 'Automated pattern detection' }
                ].map((feature) => (
                  <div key={feature.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={feature.id}
                      checked={customConfig.features?.includes(feature.id)}
                      onCheckedChange={() => handleFeatureToggle(feature.id)}
                      data-testid={`checkbox-feature-${feature.id}`}
                    />
                    <div className="flex-1">
                      <Label htmlFor={feature.id} className="text-sm font-medium">
                        {feature.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep("type")}
          data-testid="button-back-to-type"
        >
          Back
        </Button>
        <Button 
          onClick={() => setCurrentStep("preview")}
          disabled={!appName || selectedMetrics.length === 0}
          className="flex-1"
          data-testid="button-next-to-preview"
        >
          Preview & Generate
        </Button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">App Preview</h2>
        <p className="text-muted-foreground">
          Review your configuration and generate your mini-app
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            {appName}
          </CardTitle>
          <div className="flex gap-2">
            <Badge>{appType.charAt(0).toUpperCase() + appType.slice(1)}</Badge>
            <Badge variant="outline">{customConfig.theme}</Badge>
            <Badge variant="outline">{customConfig.layout}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Included Metrics ({selectedMetrics.length})</h4>
            <div className="flex flex-wrap gap-2">
              {selectedMetrics.map((metric) => (
                <Badge key={metric} variant="secondary">{metric}</Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Features ({customConfig.features?.length || 0})</h4>
            <div className="flex flex-wrap gap-2">
              {(customConfig.features || []).map((feature) => (
                <Badge key={feature} variant="outline">{feature}</Badge>
              ))}
            </div>
          </div>

          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Your mini-app will be generated as a standalone web application that you can 
              share, embed, or access anytime through your dashboard.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep("config")}
          data-testid="button-back-to-config"
        >
          Back to Config
        </Button>
        <Button 
          onClick={generateApp}
          disabled={generateAppMutation.isPending}
          className="flex-1"
          data-testid="button-generate-app"
        >
          {generateAppMutation.isPending ? "Generating..." : "Generate App"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {currentStep === "type" && renderAppTypeSelection()}
      {currentStep === "config" && renderConfiguration()}
      {currentStep === "preview" && renderPreview()}
    </div>
  );
}