import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  BookOpen, 
  Code, 
  Database, 
  ExternalLink, 
  FileText, 
  Globe, 
  Server, 
  Settings,
  ArrowRight,
  Download,
  Play,
  HelpCircle
} from "lucide-react";

export default function Docs() {
  const quickStartGuides = [
    {
      title: "Getting Started with FHIR",
      description: "Learn the basics of FHIR resources, RESTful APIs, and healthcare data exchange",
      icon: <BookOpen className="h-6 w-6" />,
      href: "/demo",
      badge: "Interactive"
    },
    {
      title: "Setting Up Your FHIR Server", 
      description: "Step-by-step guide to configure HAPI FHIR server for development",
      icon: <Server className="h-6 w-6" />,
      href: "/lab/day1",
      badge: "Lab Exercise"
    },
    {
      title: "Working with Synthea Data",
      description: "Generate and upload realistic synthetic patient data for testing",
      icon: <Database className="h-6 w-6" />,
      href: "/lab/day1", 
      badge: "Hands-on"
    },
    {
      title: "FHIR Bundle Operations",
      description: "Master bundle uploads, transactions, and batch processing",
      icon: <Code className="h-6 w-6" />,
      href: "/resources",
      badge: "Reference"
    }
  ];

  const apiReferences = [
    {
      category: "Core FHIR APIs",
      items: [
        { name: "Patient Resource", description: "Demographics and administrative data", endpoint: "/Patient" },
        { name: "Observation Resource", description: "Clinical findings, vital signs, lab results", endpoint: "/Observation" },
        { name: "Encounter Resource", description: "Healthcare service interactions", endpoint: "/Encounter" },
        { name: "Condition Resource", description: "Clinical conditions and problems", endpoint: "/Condition" }
      ]
    },
    {
      category: "Search Operations", 
      items: [
        { name: "Search by Patient", description: "Find resources for specific patients", endpoint: "/Patient?_id={id}" },
        { name: "Date Range Search", description: "Filter by effective date ranges", endpoint: "/Observation?date=ge2023-01-01" },
        { name: "Code-based Search", description: "Search by medical terminology codes", endpoint: "/Observation?code=29463-7" },
        { name: "Chained Parameters", description: "Search across resource references", endpoint: "/Observation?patient.name=Smith" }
      ]
    },
    {
      category: "Bundle Operations",
      items: [
        { name: "Transaction Bundle", description: "Atomic operations across resources", endpoint: "POST /Bundle (transaction)" },
        { name: "Batch Bundle", description: "Non-atomic bulk operations", endpoint: "POST /Bundle (batch)" },
        { name: "Search Bundle", description: "Paginated search results", endpoint: "GET /Patient?_count=20" },
        { name: "History Bundle", description: "Resource version history", endpoint: "/Patient/{id}/_history" }
      ]
    }
  ];

  const toolsAndResources = [
    {
      name: "HAPI FHIR Server",
      description: "Open source Java-based FHIR server implementation",
      url: "https://hapifhir.io/",
      type: "Server"
    },
    {
      name: "Synthea Patient Generator", 
      description: "Synthetic patient population simulator", 
      url: "https://synthetichealth.github.io/synthea/",
      type: "Data"
    },
    {
      name: "FHIR Validator",
      description: "Official HL7 FHIR resource validation tool",
      url: "https://confluence.hl7.org/display/FHIR/Using+the+FHIR+Validator",
      type: "Validation"
    },
    {
      name: "Postman FHIR Collections",
      description: "Ready-to-use API testing collections for FHIR",
      url: "https://www.postman.com/fhir",
      type: "Testing"
    },
    {
      name: "SMART on FHIR",
      description: "Authorization framework for healthcare applications",
      url: "https://docs.smarthealthit.org/",
      type: "Security"
    },
    {
      name: "FHIR Shorthand (FSH)",
      description: "Domain-specific language for defining FHIR artifacts",
      url: "https://build.fhir.org/ig/HL7/fhir-shorthand/",
      type: "Authoring"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Documentation & Resources</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive guides, API references, and tools to master FHIR healthcare interoperability
          </p>
        </div>

        {/* Quick Start Guides */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Start Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickStartGuides.map((guide, index) => (
              <Link key={index} href={guide.href}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {guide.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{guide.title}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {guide.badge}
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{guide.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* API Reference */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">API Reference</h2>
          <div className="space-y-8">
            {apiReferences.map((section, sectionIndex) => (
              <Card key={sectionIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>{section.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{item.name}</h4>
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.endpoint}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tools & Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Tools & External Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolsAndResources.map((tool, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <Badge variant="outline">{tool.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground flex-grow">{tool.description}</p>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a href={tool.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Resource
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Help */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5" />
              <span>Getting Help</span>
            </CardTitle>
            <CardDescription>
              Need assistance? Here are the best ways to get support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-950 rounded-full w-fit">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Try the Demo</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Experience the full platform with interactive demos
                </p>
                <Link href="/demo">
                  <Button variant="outline" size="sm">
                    Launch Demo
                  </Button>
                </Link>
              </div>
              
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-950 rounded-full w-fit">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Video Tutorials</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Watch step-by-step guides for complex topics
                </p>
                <Link href="/help">
                  <Button variant="outline" size="sm">
                    View Tutorials
                  </Button>
                </Link>
              </div>
              
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 bg-purple-100 dark:bg-purple-950 rounded-full w-fit">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Troubleshooting</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Common issues and their solutions
                </p>
                <Link href="/troubleshooting">
                  <Button variant="outline" size="sm">
                    Get Help
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}