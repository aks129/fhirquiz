import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import SEOHead from "@/components/seo-head";
import { 
  BookOpen, 
  Code, 
  Database, 
  Globe, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from "lucide-react";

export default function QuickReference() {
  return (
    <>
      <SEOHead 
        title="Quick Reference - FHIR Foundation Exam Prep"
        description="Quick reference guides for FHIR concepts, HTTP status codes, search parameters, and common patterns for exam preparation."
      />
      
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/study">
            <Button variant="ghost" size="sm" data-testid="back-to-study">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Study Mode
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <BookOpen className="w-12 h-12 text-blue-500" />
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Quick Reference Guide
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mt-2">
                Essential FHIR concepts and patterns for exam success
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="http" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="http" data-testid="tab-http">HTTP & REST</TabsTrigger>
            <TabsTrigger value="search" data-testid="tab-search">Search</TabsTrigger>
            <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
            <TabsTrigger value="datatypes" data-testid="tab-datatypes">Data Types</TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
            <TabsTrigger value="terminology" data-testid="tab-terminology">Terminology</TabsTrigger>
          </TabsList>

          {/* HTTP & REST Tab */}
          <TabsContent value="http" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="http-methods-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    HTTP Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-mono">GET</Badge>
                      <span className="text-sm">Read resource(s)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-mono">POST</Badge>
                      <span className="text-sm">Create new resource</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-mono">PUT</Badge>
                      <span className="text-sm">Update/Create with ID</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-mono">PATCH</Badge>
                      <span className="text-sm">Partial update</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-mono">DELETE</Badge>
                      <span className="text-sm">Remove resource</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="status-codes-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    HTTP Status Codes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge className="bg-green-100 text-green-800 font-mono">200</Badge>
                      <span className="text-sm">OK (GET, PUT)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className="bg-green-100 text-green-800 font-mono">201</Badge>
                      <span className="text-sm">Created (POST)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className="bg-green-100 text-green-800 font-mono">204</Badge>
                      <span className="text-sm">No Content (DELETE)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className="bg-red-100 text-red-800 font-mono">400</Badge>
                      <span className="text-sm">Bad Request</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className="bg-red-100 text-red-800 font-mono">401</Badge>
                      <span className="text-sm">Unauthorized</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className="bg-red-100 text-red-800 font-mono">404</Badge>
                      <span className="text-sm">Not Found</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className="bg-orange-100 text-orange-800 font-mono">412</Badge>
                      <span className="text-sm">Precondition Failed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="conditional-operations-card" className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Conditional Operations</CardTitle>
                  <CardDescription>
                    Headers and operations for conditional CRUD
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Headers</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-mono bg-muted px-2 py-1 rounded">If-None-Exist</span> - Conditional create</div>
                        <div><span className="font-mono bg-muted px-2 py-1 rounded">If-Match</span> - Optimistic locking</div>
                        <div><span className="font-mono bg-muted px-2 py-1 rounded">If-None-Match</span> - Create only if new</div>
                        <div><span className="font-mono bg-muted px-2 py-1 rounded">If-Modified-Since</span> - Conditional read</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Examples</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div>Prevent duplicate patients</div>
                        <div>Version-based updates</div>
                        <div>Cache validation</div>
                        <div>Efficient polling</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="search-parameters-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-500" />
                    Search Parameter Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">string</Badge>
                      <span className="text-sm">Text search</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">token</Badge>
                      <span className="text-sm">Coded values</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">reference</Badge>
                      <span className="text-sm">Resource references</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">quantity</Badge>
                      <span className="text-sm">Numeric values</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">date</Badge>
                      <span className="text-sm">Temporal values</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">number</Badge>
                      <span className="text-sm">Simple numbers</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="search-modifiers-card">
                <CardHeader>
                  <CardTitle>Search Modifiers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="font-mono">:exact</Badge>
                      <span className="text-sm">Exact match</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="font-mono">:contains</Badge>
                      <span className="text-sm">Substring</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="font-mono">:missing</Badge>
                      <span className="text-sm">Element presence</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="font-mono">:not</Badge>
                      <span className="text-sm">Logical NOT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="font-mono">:above</Badge>
                      <span className="text-sm">Hierarchy up</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="font-mono">:below</Badge>
                      <span className="text-sm">Hierarchy down</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="search-examples-card" className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Common Search Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">Find patients by name</h4>
                      <code className="text-sm text-muted-foreground">GET /Patient?name=Smith</code>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium">Search by identifier</h4>
                      <code className="text-sm text-muted-foreground">GET /Patient?identifier=12345</code>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium">Date range search</h4>
                      <code className="text-sm text-muted-foreground">GET /Observation?date=ge2023-01-01&date=lt2024-01-01</code>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-medium">Chained parameters</h4>
                      <code className="text-sm text-muted-foreground">GET /Observation?subject.name=Smith</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="foundation-resources-card">
                <CardHeader>
                  <CardTitle>Foundation Resources</CardTitle>
                  <CardDescription>Core FHIR resources you must know</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Patient</span>
                      <Badge variant="secondary">Individual</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Practitioner</span>
                      <Badge variant="secondary">Provider</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Organization</span>
                      <Badge variant="secondary">Entity</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Location</span>
                      <Badge variant="secondary">Place</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Device</span>
                      <Badge variant="secondary">Equipment</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="clinical-resources-card">
                <CardHeader>
                  <CardTitle>Clinical Resources</CardTitle>
                  <CardDescription>Medical data and workflow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Observation</span>
                      <Badge variant="secondary">Measurement</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Condition</span>
                      <Badge variant="secondary">Diagnosis</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Procedure</span>
                      <Badge variant="secondary">Action</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Medication</span>
                      <Badge variant="secondary">Drug</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Encounter</span>
                      <Badge variant="secondary">Visit</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="resource-relationships-card" className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Common Resource Relationships</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Patient-Centered</h4>
                      <div className="space-y-2 text-sm">
                        <div>Patient → Observation (subject)</div>
                        <div>Patient → Condition (subject)</div>
                        <div>Patient → Encounter (subject)</div>
                        <div>Patient → MedicationRequest (subject)</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Encounter-Based</h4>
                      <div className="space-y-2 text-sm">
                        <div>Encounter → Observation (encounter)</div>
                        <div>Encounter → Procedure (encounter)</div>
                        <div>Encounter → Practitioner (participant)</div>
                        <div>Encounter → Location (location)</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Types Tab */}
          <TabsContent value="datatypes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="primitive-types-card">
                <CardHeader>
                  <CardTitle>Primitive Data Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-mono">string</Badge>
                      <span className="text-sm">Text values</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-mono">boolean</Badge>
                      <span className="text-sm">true/false</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-mono">integer</Badge>
                      <span className="text-sm">Whole numbers</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-mono">decimal</Badge>
                      <span className="text-sm">Floating point</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-mono">date</Badge>
                      <span className="text-sm">YYYY-MM-DD</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="font-mono">dateTime</Badge>
                      <span className="text-sm">ISO 8601</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="complex-types-card">
                <CardHeader>
                  <CardTitle>Complex Data Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Coding</Badge>
                      <span className="text-sm">Code + system</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">CodeableConcept</Badge>
                      <span className="text-sm">Multiple codings</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Identifier</Badge>
                      <span className="text-sm">Business identifier</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Reference</Badge>
                      <span className="text-sm">Resource link</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Quantity</Badge>
                      <span className="text-sm">Value + unit</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Period</Badge>
                      <span className="text-sm">Time interval</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="coding-vs-concept-card" className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Coding vs CodeableConcept</CardTitle>
                  <CardDescription>Understanding the difference between single codes and concepts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-blue-600">Coding</h4>
                      <div className="space-y-2 text-sm">
                        <div>• Single code from one system</div>
                        <div>• Has: code, system, display</div>
                        <div>• Example: LOINC lab code</div>
                        <div>• Used in: ValueSet definitions</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-green-600">CodeableConcept</h4>
                      <div className="space-y-2 text-sm">
                        <div>• Multiple codings for same concept</div>
                        <div>• Has: coding[], text</div>
                        <div>• Example: ICD-10 + SNOMED for diagnosis</div>
                        <div>• Used in: Resource elements</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="oauth-flow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    OAuth 2.0 / SMART on FHIR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">Authorization Code Flow:</span>
                    </div>
                    <div className="pl-4 space-y-1 text-sm text-muted-foreground">
                      <div>1. Client → Authorization Server</div>
                      <div>2. User authenticates</div>
                      <div>3. Authorization code returned</div>
                      <div>4. Exchange code for token</div>
                      <div>5. Use token for API calls</div>
                    </div>
                    <div className="mt-4">
                      <Badge variant="outline">Scopes</Badge>
                      <div className="mt-2 space-y-1 text-sm">
                        <div><code>patient/*.read</code> - Read patient data</div>
                        <div><code>user/*.write</code> - Write user data</div>
                        <div><code>system/*.read</code> - System access</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="security-labels-card">
                <CardHeader>
                  <CardTitle>Security Labels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Confidentiality</Badge>
                      <span className="text-sm">N, R, V</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Sensitivity</Badge>
                      <span className="text-sm">ETH, PSY, HIV</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Integrity</Badge>
                      <span className="text-sm">Data quality</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Handling</Badge>
                      <span className="text-sm">Special rules</span>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <div><strong>N</strong> - Normal, <strong>R</strong> - Restricted, <strong>V</strong> - Very restricted</div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="access-control-card" className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Access Control Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <Badge className="mb-2">Patient Access</Badge>
                      <div className="text-sm text-muted-foreground">
                        Patients access own data via patient-facing apps
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge className="mb-2">Provider Access</Badge>
                      <div className="text-sm text-muted-foreground">
                        Clinicians access via EHR-integrated apps
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge className="mb-2">System Access</Badge>
                      <div className="text-sm text-muted-foreground">
                        Backend services with client credentials
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Terminology Tab */}
          <TabsContent value="terminology" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="standard-terminologies-card">
                <CardHeader>
                  <CardTitle>Standard Terminologies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">SNOMED CT</Badge>
                      <span className="text-sm">Clinical terms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">LOINC</Badge>
                      <span className="text-sm">Lab & observations</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">ICD-10</Badge>
                      <span className="text-sm">Diagnoses</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">CPT</Badge>
                      <span className="text-sm">Procedures</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">RxNorm</Badge>
                      <span className="text-sm">Medications</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">UCUM</Badge>
                      <span className="text-sm">Units</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="binding-strength-card">
                <CardHeader>
                  <CardTitle>Binding Strength</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge className="bg-red-100 text-red-800">required</Badge>
                      <span className="text-sm">Must use ValueSet</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className="bg-orange-100 text-orange-800">extensible</Badge>
                      <span className="text-sm">Use if suitable</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className="bg-yellow-100 text-yellow-800">preferred</Badge>
                      <span className="text-sm">Encouraged</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className="bg-gray-100 text-gray-800">example</Badge>
                      <span className="text-sm">Illustrative only</span>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Stronger bindings limit implementer flexibility
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="terminology-operations-card" className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Terminology Operations</CardTitle>
                  <CardDescription>Common FHIR terminology service operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">ValueSet Operations</h4>
                      <div className="space-y-2 text-sm">
                        <div><code>$expand</code> - Get all codes in ValueSet</div>
                        <div><code>$validate-code</code> - Check if code in ValueSet</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">CodeSystem Operations</h4>
                      <div className="space-y-2 text-sm">
                        <div><code>$lookup</code> - Get details for a code</div>
                        <div><code>$subsumes</code> - Check hierarchy relationship</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}