import { useQuery } from "@tanstack/react-query";
import ProgressCard from "@/components/lab/progress-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { LabProgress } from "@/types/api";
import { PlayCircle, Sparkles } from "lucide-react";

export default function Overview() {
  const { data: progress = [] } = useQuery<LabProgress[]>({
    queryKey: ["/api/lab/progress"],
  });

  const getProgressForDay = (day: number) => {
    const dayProgress = progress.filter((p: LabProgress) => p.labDay === day);
    const completed = dayProgress.filter((p: LabProgress) => p.completed).length;
    const total = Math.max(dayProgress.length, 3); // Minimum 3 steps per day
    return { completed, total };
  };

  const day1Progress = getProgressForDay(1);
  const day2Progress = getProgressForDay(2);
  const day3Progress = getProgressForDay(3);

  const totalProgress = day1Progress.completed + day2Progress.completed + day3Progress.completed;
  const hasAnyProgress = totalProgress > 0;

  const getLabStatus = (dayProgress: { completed: number; total: number }) => {
    if (dayProgress.completed === dayProgress.total && dayProgress.total > 0) return "complete";
    if (dayProgress.completed > 0) return "in-progress";
    return "pending";
  };

  return (
    <div className="space-y-8">
      {/* Demo Mode Banner - Show when no progress */}
      {!hasAnyProgress && (
        <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-purple-900">New to the bootcamp?</span>
                <span className="text-purple-700 ml-2">Try our Demo Mode to explore all features with sample data!</span>
              </div>
              <Link href="/demo">
                <Button size="sm" className="ml-4" data-testid="button-try-demo">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Try Demo
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to FHIR Healthcare Bootcamp</h1>
            <p className="text-lg text-muted-foreground">Master healthcare interoperability with hands-on FHIR training</p>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
              <i className="fas fa-wifi text-green-500"></i>
              <span className="text-sm font-medium">Ready to Start</span>
            </div>
          </div>
        </div>

        {/* Progress Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ProgressCard
            day={1}
            title="Ingest & Land"
            description="Load and explore FHIR data"
            completed={day1Progress.completed}
            total={day1Progress.total}
            status={getLabStatus(day1Progress)}
          />
          <ProgressCard
            day={2}
            title="Transform & Analyze"
            description="Process data with SQL transforms"
            completed={day2Progress.completed}
            total={day2Progress.total}
            status={getLabStatus(day2Progress)}
          />
          <ProgressCard
            day={3}
            title="Operationalize"
            description="Publish insights back to FHIR"
            completed={day3Progress.completed}
            total={day3Progress.total}
            status={getLabStatus(day3Progress)}
          />
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Bootcamp Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-bullseye text-primary"></i>
              <span>Bootcamp Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <i className="fas fa-download text-green-500 mt-1"></i>
                <div>
                  <h3 className="font-medium text-card-foreground">Ingest</h3>
                  <p className="text-sm text-muted-foreground">Load Synthea patient bundles into FHIR servers and understand core resources</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <i className="fas fa-cogs text-amber-500 mt-1"></i>
                <div>
                  <h3 className="font-medium text-card-foreground">Transform</h3>
                  <p className="text-sm text-muted-foreground">Extract meaningful insights using SQL-based transformations and risk calculations</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <i className="fas fa-share-alt text-purple-500 mt-1"></i>
                <div>
                  <h3 className="font-medium text-card-foreground">Publish</h3>
                  <p className="text-sm text-muted-foreground">Create new FHIR Observations with computed risk scores and publish back to servers</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prerequisites & Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-clipboard-check text-primary"></i>
              <span>Prerequisites</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="text-sm text-card-foreground">Basic understanding of REST APIs</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="text-sm text-card-foreground">SQL query experience</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="text-sm text-card-foreground">JSON data manipulation</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-check-circle text-green-500"></i>
                <span className="text-sm text-card-foreground">Command line basics</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">No Prior FHIR Experience Needed!</p>
                  <p className="text-xs text-blue-600">We'll cover FHIR basics as we go, with links to expert resources from FHIR IQ.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 border border-border rounded-xl p-8 mb-8">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center space-x-3">
            <i className="fas fa-rocket text-primary"></i>
            <span>Quick Start Guide</span>
          </h2>
          <p className="text-muted-foreground mb-6">Get up and running with your FHIR learning journey in minutes.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">1</div>
                <h3 className="font-semibold text-card-foreground">Select FHIR Server</h3>
              </div>
              <p className="text-sm text-muted-foreground">Choose from pre-configured public test servers and test connectivity</p>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">2</div>
                <h3 className="font-semibold text-card-foreground">Upload Bundle</h3>
              </div>
              <p className="text-sm text-muted-foreground">Load synthetic patient data using Synthea bundles</p>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">3</div>
                <h3 className="font-semibold text-card-foreground">Start Learning</h3>
              </div>
              <p className="text-sm text-muted-foreground">Begin with Day 1 lab and progress through the curriculum</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Link href="/lab/day1">
              <Button size="lg" data-testid="button-start-day1">
                <i className="fas fa-play mr-2"></i>
                Start Day 1 Lab
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* FHIR 101 Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <i className="fas fa-graduation-cap text-primary"></i>
            <span>FHIR 101: Core Concepts</span>
          </CardTitle>
          <p className="text-muted-foreground">Essential healthcare interoperability concepts you'll encounter throughout the labs</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* IDs vs Identifiers */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
                  <i className="fas fa-fingerprint text-blue-600"></i>
                  <span>IDs vs Identifiers</span>
                </h3>
                <p className="text-sm text-blue-700 mb-3">FHIR resources have both logical IDs (server-assigned) and business identifiers (like MRN, SSN).</p>
                <div className="bg-white rounded border p-3 font-mono text-xs">
                  <div className="text-gray-600">// Logical ID (server-assigned)</div>
                  <div className="text-blue-600">"id": "patient-123"</div>
                  <div className="text-gray-600 mt-2">// Business identifier</div>
                  <div className="text-green-600">"identifier": [{"{"}"system": "MRN", "value": "12345"{"}"}]</div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center space-x-2">
                  <i className="fas fa-sitemap text-green-600"></i>
                  <span>References</span>
                </h3>
                <p className="text-sm text-green-700 mb-3">FHIR resources link to each other using references, creating a web of connected health data.</p>
                <div className="bg-white rounded border p-3 font-mono text-xs">
                  <div className="text-gray-600">// Reference to a Patient</div>
                  <div className="text-green-600">"subject": {"{"}"reference": "Patient/123"{"}"}  </div>
                </div>
              </div>
            </div>

            {/* Bundles and CodeableConcepts */}
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2 flex items-center space-x-2">
                  <i className="fas fa-layer-group text-purple-600"></i>
                  <span>Bundles</span>
                </h3>
                <p className="text-sm text-purple-700 mb-3">Collections of resources that can be transmitted and processed together as a unit.</p>
                <div className="bg-white rounded border p-3 font-mono text-xs">
                  <div className="text-gray-600">// Transaction bundle</div>
                  <div className="text-purple-600">"type": "transaction"</div>
                  <div className="text-purple-600">"entry": [/* resources */]</div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-2 flex items-center space-x-2">
                  <i className="fas fa-tags text-orange-600"></i>
                  <span>CodeableConcepts</span>
                </h3>
                <p className="text-sm text-orange-700 mb-3">Standardized codes (LOINC, SNOMED) that enable precise healthcare meanings across systems.</p>
                <div className="bg-white rounded border p-3 font-mono text-xs">
                  <div className="text-gray-600">// Blood pressure code</div>
                  <div className="text-orange-600">"system": "http://loinc.org"</div>
                  <div className="text-orange-600">"code": "85354-9"</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <i className="fas fa-external-link-alt text-blue-500 mt-1"></i>
              <div>
                <p className="text-sm text-blue-700 font-medium mb-1">Learn More from FHIR Expert FHIR IQ</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <a 
                    href="https://darrendevitt.com/7-steps-to-fhir-for-developers-2/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center space-x-1"
                    data-testid="link-7-steps-fhir"
                  >
                    <i className="fas fa-link"></i>
                    <span>7 Steps to FHIR</span>
                  </a>
                  <a 
                    href="https://darrendevitt.com/fhir-test-data-from-synthea/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center space-x-1"
                    data-testid="link-test-data-guide"
                  >
                    <i className="fas fa-link"></i>
                    <span>FHIR Test Data Guide</span>
                  </a>
                  <a 
                    href="https://darrendevitt.com/a-tutorial-on-fhir-transaction-bundles/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center space-x-1"
                    data-testid="link-transaction-bundles"
                  >
                    <i className="fas fa-link"></i>
                    <span>Transaction Bundles</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lab Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">1</div>
              <div>
                <h3 className="font-semibold text-green-800">Day 1: Ingest & Land</h3>
                <p className="text-sm text-green-600">Load FHIR bundles and explore data</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-green-700 mb-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-server text-green-600"></i>
                <span>FHIR server connectivity</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-upload text-green-600"></i>
                <span>Synthea bundle upload</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-download text-green-600"></i>
                <span>CSV data export</span>
              </div>
            </div>
            <Link href="/lab/day1">
              <Button className="w-full bg-green-500 hover:bg-green-600" data-testid="button-start-day1">
                {day1Progress.completed > 0 ? "Continue Day 1" : "Start Day 1"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className={`${day1Progress.completed === day1Progress.total && day1Progress.total > 0 
          ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200" 
          : "bg-gray-50 border-gray-200 opacity-60"}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg">2</div>
              <div>
                <h3 className="font-semibold text-amber-800">Day 2: Transform & Analyze</h3>
                <p className="text-sm text-amber-600">SQL transformations and risk analysis</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-amber-700 mb-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-database text-amber-600"></i>
                <span>SQL staging tables</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-calculator text-amber-600"></i>
                <span>Risk score calculations</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-flag text-amber-600"></i>
                <span>Readmission predictions</span>
              </div>
            </div>
            <Link href="/lab/day2">
              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600" 
                disabled={!(day1Progress.completed === day1Progress.total && day1Progress.total > 0)}
                data-testid="button-start-day2"
              >
                {day1Progress.completed === day1Progress.total && day1Progress.total > 0 
                  ? "Start Day 2" 
                  : "Complete Day 1 to Unlock"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
