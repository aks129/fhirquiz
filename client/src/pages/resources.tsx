import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Resources() {
  const expertResources = [
    {
      id: "7-steps",
      title: "7 Steps to FHIR for Developers",
      description: "The most effective learning path for developers new to FHIR, including hands-on practice with Postman and local server setup.",
      url: "https://fhiriq.com/7-steps-to-fhir-for-developers-2/",
      category: "Getting Started",
      icon: "fas fa-play",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      categoryColor: "bg-blue-100 text-blue-700",
    },
    {
      id: "test-data",
      title: "FHIR Patient Test Data",
      description: "Complete guide to using Synthea-generated synthetic patient data for FHIR development and testing.",
      url: "https://fhiriq.com/fhir-test-data-from-synthea/",
      category: "Test Data",
      icon: "fas fa-database",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      categoryColor: "bg-green-100 text-green-700",
    },
    {
      id: "transaction-bundles",
      title: "Transaction Bundles Tutorial",
      description: "Master FHIR transaction bundles for updating or creating multiple resources with complete success or failure.",
      url: "https://fhiriq.com/a-tutorial-on-fhir-transaction-bundles/",
      category: "Advanced",
      icon: "fas fa-code",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      categoryColor: "bg-orange-100 text-orange-700",
    },
    {
      id: "beyond-basics",
      title: "FHIR: Beyond the Basics",
      description: "Seven FHIR concepts that beginners may not be familiar with, including pagination, batch bundles, and resource versioning.",
      url: "https://fhiriq.com/fhir-beyond-the-basics/",
      category: "Advanced",
      icon: "fas fa-rocket",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      categoryColor: "bg-purple-100 text-purple-700",
    },
    {
      id: "video-course",
      title: "FHIR for Developers Video Course",
      description: "Gino Canessa's comprehensive video course covering code-focused approaches to FHIR development with 27 detailed modules.",
      url: "https://fhiriq.com/fhir-for-developers-video-course/",
      category: "Video Learning",
      icon: "fas fa-video",
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      categoryColor: "bg-red-100 text-red-700",
    },
    {
      id: "getting-started",
      title: "Getting Started With FHIR",
      description: "Essential concepts and practical guidance for teams beginning their FHIR implementation journey.",
      url: "https://fhiriq.com/topics/getting-started-with-fhir/",
      category: "Getting Started",
      icon: "fas fa-compass",
      bgColor: "bg-teal-100",
      iconColor: "text-teal-600",
      categoryColor: "bg-teal-100 text-teal-700",
    }
  ];

  const additionalResources = [
    {
      title: "HL7 FHIR Specification",
      description: "Official FHIR R4 specification and implementation guides",
      url: "https://www.hl7.org/fhir/",
      icon: "fas fa-book",
    },
    {
      title: "Synthea Patient Generator",
      description: "Open-source synthetic patient population simulator",
      url: "https://synthetichealth.github.io/synthea/",
      icon: "fas fa-users",
    },
    {
      title: "HAPI FHIR Documentation",
      description: "Comprehensive documentation for the HAPI FHIR server",
      url: "https://hapifhir.io/",
      icon: "fas fa-server",
    },
    {
      title: "Medplum Developer Docs",
      description: "Developer resources for the Medplum FHIR platform",
      url: "https://docs.medplum.com/",
      icon: "fas fa-code-branch",
    }
  ];

  const quickTips = [
    {
      title: "Start Small",
      description: "Begin with simple FHIR resources like Patient and Observation before tackling complex scenarios.",
      icon: "fas fa-seedling",
    },
    {
      title: "Use Public Test Servers",
      description: "Always use synthetic data on public servers. Never expose real patient information (PII/PHI).",
      icon: "fas fa-shield-alt",
    },
    {
      title: "Master CodeableConcepts",
      description: "Understanding LOINC and SNOMED codes is crucial for meaningful healthcare interoperability.",
      icon: "fas fa-tags",
    },
    {
      title: "Practice with Postman",
      description: "Test FHIR APIs directly with REST clients before implementing in your applications.",
      icon: "fas fa-paper-plane",
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">FHIR Learning Resources</h1>
        <p className="text-lg text-muted-foreground">Curated materials from globally recognized FHIR experts</p>
      </div>

      {/* Expert Resources by FHIR IQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <i className="fas fa-star text-primary"></i>
            <span>Expert Resources by FHIR IQ</span>
          </CardTitle>
          <p className="text-muted-foreground">
FHIR IQ is a globally recognized FHIR expert organization that has helped companies like Olympus, Optum, 
            and United Healthcare with their FHIR projects. Here are their most valuable educational resources.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {expertResources.map((resource) => (
              <div key={resource.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 ${resource.bgColor} rounded-lg flex items-center justify-center`}>
                    <i className={`${resource.icon} ${resource.iconColor}`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-card-foreground">
                        <a 
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                          data-testid={`link-${resource.id}`}
                        >
                          {resource.title}
                        </a>
                      </h3>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${resource.categoryColor}`}>
                        {resource.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                    <Button size="sm" variant="outline" asChild>
                      <a 
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`button-${resource.id}`}
                      >
                        <i className="fas fa-external-link-alt mr-2"></i>
                        Read More
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <i className="fas fa-user-tie text-blue-600"></i>
              <div>
                <p className="text-sm font-medium text-blue-800">About FHIR IQ</p>
                <p className="text-xs text-blue-600">
                  Globally recognized FHIR expert organization, FHIR DevDays presenter, and advisor to leading MedTech companies, 
                  large US health insurance companies, and healthcare providers worldwide.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips for Success */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <i className="fas fa-lightbulb text-primary"></i>
            <span>Quick Tips for FHIR Success</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickTips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
                <i className={`${tip.icon} text-primary mt-1`}></i>
                <div>
                  <h4 className="font-medium text-foreground mb-1">{tip.title}</h4>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <i className="fas fa-book-open text-primary"></i>
            <span>Additional FHIR Resources</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {additionalResources.map((resource, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:shadow-sm transition-shadow">
                <i className={`${resource.icon} text-primary mt-1`}></i>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">
                    <a 
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                      data-testid={`link-additional-${index}`}
                    >
                      {resource.title}
                    </a>
                  </h4>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                </div>
                <i className="fas fa-external-link-alt text-muted-foreground"></i>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Community and Support */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-green-800">
            <i className="fas fa-users text-green-600"></i>
            <span>Join the FHIR Community</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700 mb-4">
            Connect with other FHIR developers, ask questions, and stay updated on the latest developments 
            in healthcare interoperability.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" variant="outline" className="border-green-300 text-green-700" asChild>
              <a href="https://chat.fhir.org/" target="_blank" rel="noopener noreferrer" data-testid="link-fhir-chat">
                <i className="fab fa-slack mr-2"></i>
                FHIR Chat
              </a>
            </Button>
            <Button size="sm" variant="outline" className="border-green-300 text-green-700" asChild>
              <a href="https://www.hl7.org/fhir/community.html" target="_blank" rel="noopener noreferrer" data-testid="link-hl7-community">
                <i className="fas fa-comments mr-2"></i>
                HL7 Community
              </a>
            </Button>
            <Button size="sm" variant="outline" className="border-green-300 text-green-700" asChild>
              <a href="https://www.devdays.com/" target="_blank" rel="noopener noreferrer" data-testid="link-devdays">
                <i className="fas fa-calendar mr-2"></i>
                FHIR DevDays
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
