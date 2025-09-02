import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Troubleshooting() {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const commonIssues = [
    {
      id: "connection-failed",
      title: "FHIR Server Connection Failed",
      category: "connectivity",
      severity: "high",
      symptoms: ["Connection timeout", "401/403 errors", "SSL certificate errors"],
      causes: [
        "Public test server may be down or overloaded",
        "Network firewall blocking FHIR endpoints",
        "Invalid server URL or missing /metadata endpoint",
        "Server requires authentication not configured"
      ],
      solutions: [
        "Try a different public FHIR server from the dropdown",
        "Verify the server URL ends with the FHIR base (e.g., /baseR4)",
        "Check if the server supports the /metadata endpoint",
        "Use HTTPS instead of HTTP for secure connections",
        "Test connectivity with curl: curl -H 'Accept: application/fhir+json' [SERVER_URL]/metadata"
      ],
      prevention: "Always test server connectivity before starting labs"
    },
    {
      id: "bundle-upload-failed",
      title: "Bundle Upload Rejected",
      category: "data",
      severity: "medium",
      symptoms: ["422 Unprocessable Entity", "Bundle validation errors", "Reference resolution failures"],
      causes: [
        "Invalid FHIR Bundle structure or missing required fields",
        "FHIR version mismatch (STU3 vs R4 vs R5)",
        "Circular references or unresolvable resource references",
        "Server-specific validation rules not met"
      ],
      solutions: [
        "Validate bundle JSON structure against FHIR R4 specification",
        "Ensure bundle.type is 'transaction' for atomic operations",
        "Check that all resource references use correct format (ResourceType/id)",
        "Try uploading individual resources instead of transaction bundle",
        "Use FHIR validator tools to check bundle before upload"
      ],
      prevention: "Use validated Synthea bundles and check FHIR version compatibility"
    },
    {
      id: "version-mismatch",
      title: "FHIR Version Compatibility Issues",
      category: "compatibility",
      severity: "medium",
      symptoms: ["Unexpected resource structure", "Missing or deprecated fields", "Validation warnings"],
      causes: [
        "Mixing FHIR STU3, R4, and R5 resources",
        "Server supports different FHIR version than expected",
        "Synthea bundle generated for different FHIR version"
      ],
      solutions: [
        "Check server CapabilityStatement for supported FHIR version",
        "Use Synthea bundles matching your target FHIR version",
        "Update resource structures to match server's FHIR version",
        "Configure client to use correct FHIR version headers"
      ],
      prevention: "Always verify FHIR version compatibility before starting"
    },
    {
      id: "reference-resolution",
      title: "Reference Resolution Failures",
      category: "data",
      severity: "medium",
      symptoms: ["Referenced resource not found", "Broken resource links", "Orphaned observations"],
      causes: [
        "Resources uploaded in wrong order",
        "Conditional references not properly configured",
        "Patient or Encounter references pointing to non-existent resources"
      ],
      solutions: [
        "Upload Patient resources before dependent resources",
        "Use conditional creates with proper identifier systems",
        "Verify all references use correct resource type and ID format",
        "Check server logs for detailed reference resolution errors"
      ],
      prevention: "Use transaction bundles to ensure atomic uploads"
    },
    {
      id: "search-query-errors",
      title: "Search Query Not Working",
      category: "queries",
      severity: "low",
      symptoms: ["Empty search results", "Invalid search parameter errors", "Timeout on large queries"],
      causes: [
        "Search parameters not supported by server",
        "Incorrect query syntax or parameter values",
        "Missing data for search criteria",
        "Server search capabilities limited"
      ],
      solutions: [
        "Check server CapabilityStatement for supported search parameters",
        "Use _summary=count for count-only queries",
        "Add _count parameter to limit result size",
        "Test with simpler queries first",
        "Use GET instead of POST for search queries when possible"
      ],
      prevention: "Review server search capabilities before building complex queries"
    },
    {
      id: "csv-export-empty",
      title: "CSV Export Returns No Data",
      category: "export",
      severity: "low",
      symptoms: ["Empty CSV files", "Export job fails silently", "Missing expected columns"],
      causes: [
        "No data matching export criteria",
        "Patient ID not found in server",
        "Resource type not available",
        "Server pagination not handled properly"
      ],
      solutions: [
        "Verify patient data exists using direct FHIR search",
        "Check patient ID format and existence",
        "Use broader search criteria for export",
        "Handle server pagination in export logic",
        "Export individual resource types separately"
      ],
      prevention: "Validate data existence before attempting export"
    }
  ];

  const strategies = [
    {
      title: "Retry with Sequential Creates",
      description: "If transaction bundles fail, try uploading resources individually",
      steps: [
        "Extract individual resources from bundle",
        "Upload Patient resources first",
        "Upload dependent resources (Encounters, Observations) after",
        "Handle each resource creation response separately"
      ]
    },
    {
      title: "Check CapabilityStatement",
      description: "Always verify server capabilities before implementation",
      steps: [
        "GET [SERVER_URL]/metadata to retrieve CapabilityStatement", 
        "Check supported resource types and interactions",
        "Verify search parameters and operations available",
        "Note any server-specific requirements or limitations"
      ]
    },
    {
      title: "Use FHIR Validation Tools",
      description: "Validate resources before uploading to prevent errors",
      steps: [
        "Use official FHIR validator from HL7",
        "Check resource structure against FHIR specification",
        "Validate CodeableConcept codes against terminology servers",
        "Test bundle structure and reference integrity"
      ]
    },
    {
      title: "Debug with Network Tools",
      description: "Use browser dev tools or API clients to debug issues",
      steps: [
        "Open browser Network tab to inspect HTTP requests/responses",
        "Check request headers (Accept, Content-Type)",
        "Examine response status codes and error messages",
        "Use Postman or curl for isolated testing"
      ]
    }
  ];

  const bestPractices = [
    {
      icon: "fas fa-shield-alt",
      title: "Data Safety",
      description: "Never use real patient data (PII/PHI) on public test servers",
      details: "Always use synthetic data like Synthea patients for development and testing"
    },
    {
      icon: "fas fa-database",
      title: "Server Selection", 
      description: "Choose stable, well-maintained public FHIR servers",
      details: "Prefer HAPI FHIR or Medplum demo servers over experimental endpoints"
    },
    {
      icon: "fas fa-code",
      title: "Error Handling",
      description: "Implement robust error handling for all FHIR operations",
      details: "Check HTTP status codes, parse OperationOutcome resources, and provide meaningful user feedback"
    },
    {
      icon: "fas fa-clock",
      title: "Rate Limiting",
      description: "Respect server rate limits and implement proper retry logic",
      details: "Add delays between requests and handle 429 Too Many Requests responses"
    },
    {
      icon: "fas fa-book",
      title: "Documentation",
      description: "Always consult server-specific documentation",
      details: "Each FHIR server may have unique requirements, limitations, or extensions"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Troubleshooting FHIR</h1>
        <p className="text-lg text-muted-foreground">Common issues, solutions, and best practices for FHIR development</p>
      </div>

      {/* Quick Alert */}
      <Alert>
        <i className="fas fa-info-circle"></i>
        <AlertDescription>
          Most FHIR issues stem from version mismatches, authentication problems, or invalid resource structures. 
          Start by checking the server's CapabilityStatement and validating your data.
        </AlertDescription>
      </Alert>

      {/* Common Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <i className="fas fa-exclamation-triangle text-primary"></i>
            <span>Common FHIR Issues</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Frequently encountered problems and their solutions
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commonIssues.map((issue) => (
              <Collapsible key={issue.id} open={openSections.includes(issue.id)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto border border-border rounded-lg hover:bg-accent"
                    onClick={() => toggleSection(issue.id)}
                    data-testid={`issue-${issue.id}`}
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className={`w-3 h-3 rounded-full ${
                        issue.severity === 'high' ? 'bg-red-500' :
                        issue.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <h3 className="font-semibold text-foreground">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{issue.category} • {issue.severity} priority</p>
                      </div>
                    </div>
                    <i className={`fas fa-chevron-${openSections.includes(issue.id) ? 'up' : 'down'}`}></i>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 p-4 border border-border rounded-lg bg-muted">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                        <i className="fas fa-search text-red-500"></i>
                        <span>Symptoms</span>
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                        {issue.symptoms.map((symptom, index) => (
                          <li key={index}>• {symptom}</li>
                        ))}
                      </ul>

                      <h4 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                        <i className="fas fa-question-circle text-amber-500"></i>
                        <span>Common Causes</span>
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {issue.causes.map((cause, index) => (
                          <li key={index}>• {cause}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                        <i className="fas fa-wrench text-green-500"></i>
                        <span>Solutions</span>
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                        {issue.solutions.map((solution, index) => (
                          <li key={index}>• {solution}</li>
                        ))}
                      </ul>

                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <h5 className="font-medium text-blue-800 mb-1 flex items-center space-x-1">
                          <i className="fas fa-lightbulb text-blue-600"></i>
                          <span>Prevention</span>
                        </h5>
                        <p className="text-sm text-blue-700">{issue.prevention}</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Debugging Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <i className="fas fa-tools text-primary"></i>
            <span>Debugging Strategies</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {strategies.map((strategy, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">{strategy.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                <ol className="text-sm text-muted-foreground space-y-1">
                  {strategy.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex">
                      <span className="mr-2 font-mono text-primary">{stepIndex + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <i className="fas fa-star text-primary"></i>
            <span>Best Practices</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestPractices.map((practice, index) => (
              <div key={index} className="text-center p-4 border border-border rounded-lg">
                <i className={`${practice.icon} text-3xl text-primary mb-3`}></i>
                <h3 className="font-semibold text-foreground mb-2">{practice.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{practice.description}</p>
                <p className="text-xs text-muted-foreground">{practice.details}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-blue-800">
            <i className="fas fa-external-link-alt text-blue-600"></i>
            <span>Additional Help Resources</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <a 
                href="https://darrendevitt.com/7-steps-to-fhir-for-developers-2/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-white border border-blue-200 rounded-lg hover:shadow-sm transition-shadow"
                data-testid="link-darren-devitt-guide"
              >
                <h4 className="font-medium text-blue-800">Darren Devitt's FHIR Guide</h4>
                <p className="text-sm text-blue-600">Comprehensive troubleshooting and best practices</p>
              </a>
              
              <a 
                href="https://www.hl7.org/fhir/validation.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-white border border-blue-200 rounded-lg hover:shadow-sm transition-shadow"
                data-testid="link-fhir-validation"
              >
                <h4 className="font-medium text-blue-800">FHIR Validation Guide</h4>
                <p className="text-sm text-blue-600">Official HL7 validation documentation</p>
              </a>
            </div>
            
            <div className="space-y-3">
              <a 
                href="https://chat.fhir.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-white border border-blue-200 rounded-lg hover:shadow-sm transition-shadow"
                data-testid="link-fhir-chat"
              >
                <h4 className="font-medium text-blue-800">FHIR Community Chat</h4>
                <p className="text-sm text-blue-600">Get help from the global FHIR community</p>
              </a>
              
              <a 
                href="https://www.hl7.org/fhir/documentation.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-white border border-blue-200 rounded-lg hover:shadow-sm transition-shadow"
                data-testid="link-fhir-docs"
              >
                <h4 className="font-medium text-blue-800">Official FHIR Docs</h4>
                <p className="text-sm text-blue-600">Complete FHIR R4 specification and guides</p>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
