import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImportWizard } from "@/components/byod/import-wizard";
import { Upload, Zap, BarChart3, Share2, ArrowRight, Shield, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type ByodStep = "intro" | "import" | "apps" | "share";

export default function ByodPage() {
  const [currentStep, setCurrentStep] = useState<ByodStep>("intro");
  const [importData, setImportData] = useState<any>(null);
  const [safetyMode, setSafetyMode] = useState(true);
  const [syntheticDataConfirmed, setSyntheticDataConfirmed] = useState(false);

  // Query local FHIR status
  const { data: fhirBaseUrl } = useQuery({
    queryKey: ["/api/fhir/base-url"],
    refetchInterval: 5000,
  });

  // Query generated apps
  const { data: generatedApps, refetch: refetchApps } = useQuery({
    queryKey: ["/api/byod/apps"],
    enabled: currentStep === "share",
  });

  // Determine if using local FHIR
  const useLocalFhir = fhirBaseUrl?.includes("localhost") || fhirBaseUrl?.includes("127.0.0.1");

  const handleImportComplete = (result: { sessionId: string; preview: any }) => {
    setImportData(result);
    setCurrentStep("apps");
  };

  const renderIntroduction = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Bring Your Own Data (BYOD)</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transform your personal health data into FHIR-compliant observations 
          and create custom mini-applications for insights and sharing.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardContent className="p-6">
            <Upload className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Import Data</h3>
            <p className="text-muted-foreground text-sm">
              Upload health data from Apple Health, Google Fit, Fitbit, or custom CSV files
            </p>
            <Badge variant="secondary" className="mt-3">Step 1</Badge>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <Zap className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold mb-2">Generate Apps</h3>
            <p className="text-muted-foreground text-sm">
              Create personalized dashboards, trend analyzers, and insight generators
            </p>
            <Badge variant="secondary" className="mt-3">Step 2</Badge>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <Share2 className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h3 className="text-lg font-semibold mb-2">Share & Publish</h3>
            <p className="text-muted-foreground text-sm">
              Publish FHIR observations to servers and share mini-apps with others
            </p>
            <Badge variant="secondary" className="mt-3">Step 3</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900">✨ What You Can Create</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">📊 Health Dashboards</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Interactive charts and visualizations</li>
                <li>• Real-time metric tracking</li>
                <li>• Custom time ranges and filters</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">📈 Trend Analysis</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Long-term pattern detection</li>
                <li>• Predictive insights</li>
                <li>• Goal tracking and achievements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="bg-green-50 border-green-200">
        <Activity className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900">
          <strong className="font-semibold">Learn FHIR by Doing:</strong> This tool converts your personal health data into
          FHIR Observation resources using standardized LOINC codes - the same process used in real healthcare systems!
        </AlertDescription>
      </Alert>

      <div className="text-center">
        <Button 
          size="lg" 
          onClick={() => setCurrentStep("import")}
          className="px-8"
          data-testid="button-start-import"
        >
          Start Importing Your Data
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  const createAppMutation = useMutation({
    mutationFn: async (data: { appType: string; appName: string }) => {
      const metrics = Object.keys(importData?.preview || {});
      const response = await fetch("/api/byod/generate-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          byodSessionId: importData?.sessionId,
          appName: data.appName,
          appType: data.appType,
          metrics,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate app");
      return response.json();
    },
    onSuccess: (result) => {
      refetchApps();
      setCurrentStep("share");
    },
  });

  const handleCreateApp = (appType: string, appName: string) => {
    createAppMutation.mutate({ appType, appName });
  };

  const renderAppGeneration = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Generate Your Mini-Apps</h1>
        <p className="text-muted-foreground">
          Create custom applications based on your imported health data
        </p>
      </div>

      {importData && (
        <Card>
          <CardHeader>
            <CardTitle>Import Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{importData.recordCount || 0}</div>
                <div className="text-sm text-muted-foreground">Records Imported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Object.keys(importData.preview || {}).length}</div>
                <div className="text-sm text-muted-foreground">Metric Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">Ready</div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(importData.preview || {}).map((metric) => (
                <Badge key={metric} variant="outline">{metric}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="app-type-dashboard">
          <CardContent className="p-6">
            <BarChart3 className="w-12 h-12 mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Health Dashboard</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Comprehensive overview with multiple charts, KPIs, and real-time metrics
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li>• Multi-metric visualization</li>
              <li>• Interactive time controls</li>
              <li>• Export and sharing options</li>
            </ul>
            <Button
              className="w-full"
              onClick={() => handleCreateApp("dashboard", "My Health Dashboard")}
              disabled={createAppMutation.isPending}
            >
              {createAppMutation.isPending ? "Creating..." : "Create Dashboard"}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="app-type-trends">
          <CardContent className="p-6">
            <div className="w-12 h-12 mb-4 bg-green-100 rounded-lg flex items-center justify-center">
              📈
            </div>
            <h3 className="text-lg font-semibold mb-2">Trend Analyzer</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Deep dive into patterns and long-term trends in your health data
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li>• Advanced trend detection</li>
              <li>• Pattern recognition</li>
              <li>• Predictive modeling</li>
            </ul>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleCreateApp("trends", "Trend Analyzer")}
              disabled={createAppMutation.isPending}
            >
              {createAppMutation.isPending ? "Creating..." : "Create Analyzer"}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="app-type-insights">
          <CardContent className="p-6">
            <div className="w-12 h-12 mb-4 bg-purple-100 rounded-lg flex items-center justify-center">
              🔍
            </div>
            <h3 className="text-lg font-semibold mb-2">Insight Generator</h3>
            <p className="text-muted-foreground text-sm mb-4">
              AI-powered insights and recommendations based on your health patterns
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li>• Smart recommendations</li>
              <li>• Anomaly detection</li>
              <li>• Goal optimization</li>
            </ul>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleCreateApp("insights", "Insight Generator")}
              disabled={createAppMutation.isPending}
            >
              {createAppMutation.isPending ? "Creating..." : "Generate Insights"}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="app-type-custom">
          <CardContent className="p-6">
            <div className="w-12 h-12 mb-4 bg-orange-100 rounded-lg flex items-center justify-center">
              🎨
            </div>
            <h3 className="text-lg font-semibold mb-2">Custom App</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Build a personalized application with your choice of features and layout
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li>• Flexible configuration</li>
              <li>• Custom visualizations</li>
              <li>• Personalized features</li>
            </ul>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleCreateApp("custom", "Custom Health App")}
              disabled={createAppMutation.isPending}
            >
              {createAppMutation.isPending ? "Creating..." : "Customize App"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentStep("import")}
          data-testid="button-back-to-import"
        >
          Back to Import
        </Button>
        <Button
          onClick={() => setCurrentStep("share")}
          className="flex-1"
          data-testid="button-continue-to-share"
        >
          Continue to Sharing
        </Button>
      </div>
    </div>
  );

  const renderSharing = () => {
    const canPublish = !safetyMode || useLocalFhir || syntheticDataConfirmed;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Share & Publish</h1>
          <p className="text-muted-foreground">
            Publish your health data as FHIR observations and share your mini-apps
          </p>
        </div>

        {/* Local FHIR Status and Safety Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Safety Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Local FHIR Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label>FHIR Server Status:</Label>
                {useLocalFhir ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-300" data-testid="badge-local-fhir-active">
                    Local FHIR Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300" data-testid="badge-public-fhir-warning">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Public Server Mode
                  </Badge>
                )}
              </div>
            </div>

            {/* Safety Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="safety-mode">Safety Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Prevents publishing personal data to public servers
                </p>
              </div>
              <Switch
                id="safety-mode"
                checked={safetyMode}
                onCheckedChange={setSafetyMode}
                data-testid="switch-safety-mode"
              />
            </div>

            {/* Warning for Public Server + Safety Mode */}
            {safetyMode && !useLocalFhir && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Safety Mode is ON.</strong> To publish personal health data, either:
                  <br />• Turn on Local FHIR from the server selector, or
                  <br />• Use synthetic/sample data exports only
                </AlertDescription>
              </Alert>
            )}

            {/* Synthetic Data Confirmation when Safety Mode is OFF */}
            {!safetyMode && !useLocalFhir && (
              <div className="space-y-3 p-4 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="synthetic-confirm"
                    checked={syntheticDataConfirmed}
                    onCheckedChange={setSyntheticDataConfirmed}
                    data-testid="checkbox-synthetic-confirm"
                  />
                  <Label htmlFor="synthetic-confirm" className="text-sm font-medium">
                    I confirm I'm only posting synthetic/consented data
                  </Label>
                </div>
                <p className="text-xs text-orange-700">
                  You're publishing to a public server. Only use synthetic data or data you have explicit consent to share.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="fhir" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fhir" data-testid="tab-fhir-publish">FHIR Publishing</TabsTrigger>
            <TabsTrigger value="apps" data-testid="tab-app-sharing">App Sharing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fhir" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Publish to FHIR Server</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Transform your health data into FHIR-compliant Observation resources 
                  and publish them to a test FHIR server for interoperability practice.
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Available FHIR Servers</h4>
                  <div className="grid gap-3">
                    <Card className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium">HAPI FHIR Test Server</h5>
                          <p className="text-sm text-muted-foreground">Public R4 server for testing</p>
                        </div>
                        <Button 
                          size="sm" 
                          disabled={!canPublish}
                          data-testid="button-publish-hapi"
                        >
                          {canPublish ? "Publish Here" : "Blocked by Safety"}
                        </Button>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium">Medplum Test Server</h5>
                          <p className="text-sm text-muted-foreground">Developer-friendly FHIR R4</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={!canPublish}
                          data-testid="button-publish-medplum"
                        >
                          {canPublish ? "Publish Here" : "Blocked by Safety"}
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
        <TabsContent value="apps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Share Your Mini-Apps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Generate shareable links for your custom health applications 
                and embed them in other platforms.
              </p>
              
              <div className="space-y-3">
                <h4 className="font-medium">Generated Apps</h4>
                {!generatedApps || generatedApps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No apps generated yet</p>
                    <p className="text-sm">Create an app first to see sharing options</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {generatedApps.map((app: any) => (
                      <Card key={app.id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium">{app.appName}</h5>
                            <p className="text-sm text-muted-foreground capitalize">{app.appType} • Created {new Date(app.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" asChild>
                              <a href={`/byod-app/${app.id}`} target="_blank" rel="noopener noreferrer">
                                View App
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/byod-app/${app.id}`);
                            }}>
                              Copy Link
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep("apps")}
          data-testid="button-back-to-apps"
        >
          Back to Apps
        </Button>
        <Button 
          onClick={() => setCurrentStep("intro")}
          className="flex-1"
          data-testid="button-start-over"
        >
          Start Over
        </Button>
      </div>
    </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {currentStep === "intro" && renderIntroduction()}
      {currentStep === "import" && (
        <ImportWizard onComplete={handleImportComplete} />
      )}
      {currentStep === "apps" && renderAppGeneration()}
      {currentStep === "share" && renderSharing()}
    </div>
  );
}