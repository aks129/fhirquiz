import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CreateAccountCta, DemoModeCta } from "@/components/common/CtaButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  CheckCircle, 
  PlayCircle, 
  Users, 
  Database, 
  BarChart3, 
  Smartphone, 
  ArrowRight, 
  Eye,
  Upload, 
  Share2, 
  UserCheck, 
  Info, 
  Zap,
  Code,
  FileText,
  TrendingUp,
  Activity,
  Server,
  Download,
  Settings,
  Globe
} from "lucide-react";

// Simulated data for demo views
const demoData = {
  day1: {
    serverStatus: "Connected to HAPI FHIR R4 Server",
    bundles: [
      { name: "Patient_Bundle_001.json", size: "2.4 MB", resources: 156, uploaded: "2024-01-15T10:30:00Z" },
      { name: "Patient_Bundle_002.json", size: "1.8 MB", resources: 124, uploaded: "2024-01-15T10:32:00Z" },
      { name: "Patient_Bundle_003.json", size: "3.1 MB", resources: 203, uploaded: "2024-01-15T10:35:00Z" }
    ],
    csvExports: [
      { name: "patients.csv", rows: 15, size: "45 KB" },
      { name: "observations.csv", rows: 1247, size: "156 KB" },
      { name: "conditions.csv", rows: 89, size: "23 KB" },
      { name: "medications.csv", rows: 167, size: "34 KB" }
    ]
  },
  day2: {
    sqlQueries: [
      {
        name: "Patient Risk Scoring",
        query: "SELECT p.id, COUNT(c.id) as condition_count,\n       AVG(CASE WHEN c.severity = 'severe' THEN 3 ELSE 1 END) as risk_score\nFROM patients p\nLEFT JOIN conditions c ON p.id = c.patient_id\nGROUP BY p.id\nORDER BY risk_score DESC;",
        results: 15,
        executed: true
      },
      {
        name: "Medication Adherence Analysis", 
        query: "SELECT m.medication_name, \n       AVG(CASE WHEN m.status = 'active' THEN 1 ELSE 0 END) as adherence_rate\nFROM medications m\nWHERE m.date_prescribed > DATE('now', '-6 months')\nGROUP BY m.medication_name\nHAVING COUNT(*) > 5;",
        results: 23,
        executed: true
      },
      {
        name: "Population Health Trends",
        query: "SELECT DATE(o.effective_date) as date,\n       AVG(CAST(o.value as REAL)) as avg_value\nFROM observations o\nWHERE o.code = '72166-2' -- BMI\nAND o.effective_date > DATE('now', '-1 year')\nGROUP BY DATE(o.effective_date)\nORDER BY date;",
        results: 156,
        executed: true
      }
    ],
    analytics: {
      totalPatients: 15,
      highRiskPatients: 4,
      avgRiskScore: 2.3,
      medicationAdherence: 0.87
    }
  },
  day3: {
    observations: [
      {
        id: "obs-001",
        code: "risk-score-custom",
        display: "Patient Risk Score",
        value: 2.3,
        unit: "score",
        status: "final",
        published: true
      },
      {
        id: "obs-002", 
        code: "medication-adherence",
        display: "Medication Adherence Rate",
        value: 87,
        unit: "%",
        status: "final",
        published: true
      },
      {
        id: "obs-003",
        code: "population-trend",
        display: "Population BMI Trend",
        value: 24.8,
        unit: "kg/m2",
        status: "final",
        published: false
      }
    ],
    miniApps: [
      {
        name: "Patient Risk Dashboard",
        description: "Interactive dashboard showing patient risk factors and trends",
        url: "/mini-app/risk-dashboard",
        published: true
      },
      {
        name: "Medication Tracker",
        description: "Real-time medication adherence monitoring tool",
        url: "/mini-app/med-tracker", 
        published: true
      }
    ]
  }
};

export default function DemoPage() {
  const { user } = useAuth();
  const [demoMode, setDemoMode] = useState<'public' | 'logged-in'>('public');
  const [showFloatingCTA, setShowFloatingCTA] = useState(true);

  // Set demo mode in localStorage for other components to detect
  useEffect(() => {
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('demo-mode', 'true');
    
    // Initialize demo lab progress data 
    const demoLabProgress = [
      { labDay: 1, stepName: 'server_setup', completed: false },
      { labDay: 1, stepName: 'bundle_upload', completed: false },
      { labDay: 1, stepName: 'csv_export', completed: false },
      { labDay: 2, stepName: 'sql_analysis', completed: false },
      { labDay: 2, stepName: 'risk_scoring', completed: false },
      { labDay: 3, stepName: 'observation_publish', completed: false },
      { labDay: 3, stepName: 'mini_app', completed: false }
    ];
    localStorage.setItem('demo-lab-progress', JSON.stringify(demoLabProgress));
    
    return () => {
      localStorage.removeItem('demo_mode');
      localStorage.removeItem('demo-mode');
    };
  }, []);

  const switchToLoggedInDemo = () => {
    setDemoMode('logged-in');
    localStorage.setItem('demo_user_session', 'true');
  };

  const switchToPublicDemo = () => {
    setDemoMode('public');
    localStorage.removeItem('demo_user_session');
  };

  const PublishModal = ({ title, type }: { title: string; type: string }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" data-testid={`publish-${type}`}>
          <Share2 className="h-4 w-4 mr-1" />
          Publish
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publishing {title}</DialogTitle>
          <DialogDescription>
            In the real bootcamp experience, this action would:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">What happens when you publish:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>Transform your analysis into a structured FHIR Observation</li>
              <li>POST the observation to your configured FHIR server</li>
              <li>Generate a shareable mini-app with your insights</li>
              <li>Add the published work to your portfolio</li>
            </ul>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode:</strong> Server calls are mocked. In the real bootcamp, you'll publish to live FHIR servers and see your insights in action.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button variant="outline">Learn More</Button>
          <Button>Got It</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const FloatingCTA = () => {
    if (!showFloatingCTA) return null;

    return (
      <div className="fixed bottom-6 right-6 z-50" data-testid="floating-cta">
        <Card className="shadow-lg border-2 border-primary/20 bg-background/95 backdrop-blur">
          <CardContent className="p-4">
            <button 
              onClick={() => setShowFloatingCTA(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-semibold">Ready to start learning?</span>
              </div>
              
              <div className="space-y-2">
                {!user ? (
                  <>
                    <CreateAccountCta size="sm" className="w-full" data-testid="cta-create-account" />
                    <DemoModeCta size="sm" className="w-full" data-testid="cta-try-demo-mode">
                      <Eye className="h-4 w-4 mr-1" />
                      Continue in Demo Mode
                    </DemoModeCta>
                  </>
                ) : (
                  <Link href="/portal">
                    <Button size="sm" className="w-full" data-testid="cta-go-to-portal">
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Go to Learning Portal
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const DemoModeSelector = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Demo Mode
        </CardTitle>
        <CardDescription>
          Switch between public demo and logged-in demo to see different experiences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button 
            variant={demoMode === 'public' ? 'default' : 'outline'}
            size="sm"
            onClick={switchToPublicDemo}
            data-testid="demo-mode-public"
          >
            <Globe className="h-4 w-4 mr-1" />
            Public Demo
          </Button>
          <Button 
            variant={demoMode === 'logged-in' ? 'default' : 'outline'}
            size="sm"
            onClick={switchToLoggedInDemo}
            data-testid="demo-mode-logged-in"
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Logged-in Demo
          </Button>
        </div>
        {demoMode === 'logged-in' && (
          <Alert className="mt-3">
            <Info className="h-4 w-4" />
            <AlertDescription>
              You're now viewing the demo as if you were a logged-in student with purchased access.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎭 Live Demo - FHIR Healthcare Bootcamp</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the complete 3-day bootcamp with read-only simulated views. 
            See how students progress through FHIR data ingestion, transformation, and operationalization.
          </p>
        </div>

        <DemoModeSelector />

        {/* Main Demo Content */}
        <Tabs defaultValue="day1" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day1" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Day 1: Ingest
            </TabsTrigger>
            <TabsTrigger value="day2" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Day 2: Transform
            </TabsTrigger>
            <TabsTrigger value="day3" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Day 3: Operationalize
            </TabsTrigger>
          </TabsList>

          {/* Day 1: Data Ingestion */}
          <TabsContent value="day1" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  FHIR Server Connection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {demoData.day1.serverStatus}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Uploaded FHIR Bundles
                  </div>
                  <Badge variant="secondary">{demoData.day1.bundles.length} bundles</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {demoData.day1.bundles.map((bundle, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{bundle.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {bundle.resources} resources • {bundle.size}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Processed</Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Generated CSV Exports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {demoData.day1.csvExports.map((csv, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{csv.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {csv.rows} rows • {csv.size}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Day 2: Data Transformation */}
          <TabsContent value="day2" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Population Analytics Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{demoData.day2.analytics.totalPatients}</div>
                    <div className="text-sm text-muted-foreground">Total Patients</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{demoData.day2.analytics.highRiskPatients}</div>
                    <div className="text-sm text-muted-foreground">High Risk</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{demoData.day2.analytics.avgRiskScore}</div>
                    <div className="text-sm text-muted-foreground">Avg Risk Score</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{(demoData.day2.analytics.medicationAdherence * 100).toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Med Adherence</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  SQL Transformation Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoData.day2.sqlQueries.map((query, index) => (
                    <div key={index} className="border rounded-lg">
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <div className="font-medium">{query.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {query.results} results returned
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={query.executed ? "default" : "secondary"}>
                            {query.executed ? "Executed" : "Draft"}
                          </Badge>
                          <PublishModal title={query.name} type="query" />
                        </div>
                      </div>
                      <Separator />
                      <div className="p-4">
                        <ScrollArea className="h-32">
                          <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                            <code>{query.query}</code>
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Day 3: Operationalization */}
          <TabsContent value="day3" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Published FHIR Observations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {demoData.day3.observations.map((obs, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{obs.display}</div>
                        <div className="text-sm text-muted-foreground">
                          {obs.value} {obs.unit} • Status: {obs.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={obs.published ? "default" : "secondary"}>
                          {obs.published ? "Published" : "Draft"}
                        </Badge>
                        {!obs.published && (
                          <PublishModal title={obs.display} type="observation" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Mini-Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {demoData.day3.miniApps.map((app, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{app.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {app.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={app.published ? "default" : "secondary"}>
                          {app.published ? "Live" : "Development"}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Demo Information */}
        <Card className="mt-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
              📖 About This Demo
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <h4 className="font-semibold mb-2">What you're seeing:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Simulated student progress through 3-day bootcamp</li>
                  <li>Read-only views of completed lab exercises</li>
                  <li>Sample FHIR data from Synthea patient generator</li>
                  <li>Realistic SQL queries and analytics results</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">In the real bootcamp:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Interactive labs with live FHIR servers</li>
                  <li>Hands-on SQL query writing and execution</li>
                  <li>Real-time data uploads and processing</li>
                  <li>Personal progress tracking and certificates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <FloatingCTA />
    </div>
  );
}