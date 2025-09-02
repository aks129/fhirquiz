import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  HelpCircle, 
  Mail, 
  MessageSquare, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle, 
  Server, 
  Database, 
  Globe,
  Wrench,
  FileText,
  ExternalLink,
  Clock,
  Users
} from "lucide-react";

export default function Help() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
              <HelpCircle className="h-8 w-8 text-primary" />
              Help Center
            </h1>
            <p className="text-xl text-muted-foreground">
              Get support, find answers, and learn how to make the most of your FHIR bootcamp experience
            </p>
          </div>

          {/* Quick Contact */}
          <Card className="mb-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Need Immediate Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 dark:text-blue-200">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Contact Support</h3>
                  <div className="space-y-2">
                    <a 
                      href="mailto:support@fhirbootcamp.com?subject=Help Request"
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      support@fhirbootcamp.com
                    </a>
                    <p className="text-sm">Response time: 24-48 hours</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Emergency Issues</h3>
                  <div className="space-y-2">
                    <a 
                      href="mailto:urgent@fhirbootcamp.com?subject=Urgent Issue"
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      urgent@fhirbootcamp.com
                    </a>
                    <p className="text-sm">For security or access issues</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Quick Troubleshooting
                  </CardTitle>
                  <CardDescription>
                    Common issues and solutions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Server className="h-4 w-4 text-red-500" />
                      FHIR Server Connection Issues
                    </h3>
                    <div className="text-sm space-y-1 ml-6">
                      <p><strong>Problem:</strong> Cannot connect to FHIR server</p>
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Check server URL format (must include http/https)</li>
                        <li>Verify server is online and accessible</li>
                        <li>Try switching to a different test server</li>
                        <li>Clear browser cache and retry</li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4 text-orange-500" />
                      Bundle Upload Failures
                    </h3>
                    <div className="text-sm space-y-1 ml-6">
                      <p><strong>Problem:</strong> FHIR bundle won't upload</p>
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Validate JSON format using online validator</li>
                        <li>Check file size (max 10MB recommended)</li>
                        <li>Ensure bundle contains valid FHIR resources</li>
                        <li>Try uploading smaller test bundle first</li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      Login and Access Issues
                    </h3>
                    <div className="text-sm space-y-1 ml-6">
                      <p><strong>Problem:</strong> Cannot access course content</p>
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Verify your payment status in account settings</li>
                        <li>Check if course enrollment is complete</li>
                        <li>Clear browser cookies and re-login</li>
                        <li>Try incognito/private browsing mode</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Support Hours & Response Times
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">General Support</div>
                        <div className="text-sm text-muted-foreground">Course questions, technical issues</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">24-48h</div>
                        <div className="text-sm text-muted-foreground">Mon-Fri</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Billing Support</div>
                        <div className="text-sm text-muted-foreground">Payment, refunds, account issues</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">12-24h</div>
                        <div className="text-sm text-muted-foreground">Mon-Fri</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Emergency</div>
                        <div className="text-sm text-muted-foreground">Security, critical access issues</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">2-4h</div>
                        <div className="text-sm text-muted-foreground">24/7</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Documentation & Resources
                  </CardTitle>
                  <CardDescription>
                    Comprehensive guides and reference materials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <a 
                      href="https://docs.fhirbootcamp.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">Getting Started Guide</div>
                        <div className="text-sm text-muted-foreground">Complete setup and first steps</div>
                      </div>
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <a 
                      href="https://docs.fhirbootcamp.com/fhir-basics" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">FHIR Fundamentals</div>
                        <div className="text-sm text-muted-foreground">Understanding FHIR resources and structure</div>
                      </div>
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <a 
                      href="https://docs.fhirbootcamp.com/lab-guides" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">Lab Exercise Guides</div>
                        <div className="text-sm text-muted-foreground">Step-by-step instructions for all labs</div>
                      </div>
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <a 
                      href="https://docs.fhirbootcamp.com/api-reference" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">API Reference</div>
                        <div className="text-sm text-muted-foreground">Complete FHIR API documentation</div>
                      </div>
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <a 
                      href="https://docs.fhirbootcamp.com/troubleshooting" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">Troubleshooting Guide</div>
                        <div className="text-sm text-muted-foreground">Detailed solutions for common issues</div>
                      </div>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Community & Forums
                  </CardTitle>
                  <CardDescription>
                    Connect with other learners and instructors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <a 
                      href="https://community.fhirbootcamp.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">Student Forum</div>
                        <div className="text-sm text-muted-foreground">Ask questions and share solutions</div>
                      </div>
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <a 
                      href="https://discord.gg/fhirbootcamp" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">Discord Community</div>
                        <div className="text-sm text-muted-foreground">Real-time chat and study groups</div>
                      </div>
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <a 
                      href="https://github.com/fhir-bootcamp" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">GitHub Repository</div>
                        <div className="text-sm text-muted-foreground">Sample code and lab materials</div>
                      </div>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Q: Can I use real patient data in the labs?</h3>
                <p className="text-sm text-muted-foreground">
                  No, absolutely not on public test servers. Our platform exclusively uses synthetic data generated by Synthea for all training exercises. For any work with real data, you must set up a local HAPI FHIR server. See our <Link href="/security" className="text-primary hover:underline">Security Policy</Link> for complete guidelines.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Q: How do I get a refund?</h3>
                <p className="text-sm text-muted-foreground">
                  We offer a 30-day money-back guarantee for all bootcamp purchases. Contact <a href="mailto:billing@fhirbootcamp.com" className="text-primary hover:underline">billing@fhirbootcamp.com</a> with your order number and reason for the refund request.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Q: Can I download course materials?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, all lab guides, reference materials, and sample data are available for download. You'll retain access to these materials even after course completion. Videos and interactive content require an active subscription.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Q: Is there a mobile app?</h3>
                <p className="text-sm text-muted-foreground">
                  Currently, our platform is web-based and optimized for desktop/laptop use due to the nature of FHIR development work. The platform is mobile-responsive for reading materials, but hands-on labs are best experienced on a computer.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Q: Do you offer team discounts?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! We offer significant discounts for teams of 5+ learners. Contact <a href="mailto:sales@fhirbootcamp.com" className="text-primary hover:underline">sales@fhirbootcamp.com</a> for enterprise pricing and custom training options.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Options */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>All Contact Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Email Support</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href="mailto:support@fhirbootcamp.com" className="text-primary hover:underline">
                        support@fhirbootcamp.com
                      </a>
                      <span className="text-muted-foreground">- General help</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href="mailto:billing@fhirbootcamp.com" className="text-primary hover:underline">
                        billing@fhirbootcamp.com
                      </a>
                      <span className="text-muted-foreground">- Payment issues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href="mailto:security@fhirbootcamp.com" className="text-primary hover:underline">
                        security@fhirbootcamp.com
                      </a>
                      <span className="text-muted-foreground">- Security concerns</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href="mailto:sales@fhirbootcamp.com" className="text-primary hover:underline">
                        sales@fhirbootcamp.com
                      </a>
                      <span className="text-muted-foreground">- Enterprise inquiries</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Alternative Channels</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <a href="https://community.fhirbootcamp.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Community Forum
                      </a>
                      <span className="text-muted-foreground">- Public Q&A</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <a href="https://discord.gg/fhirbootcamp" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Discord Chat
                      </a>
                      <span className="text-muted-foreground">- Real-time help</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <a href="https://docs.fhirbootcamp.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Documentation
                      </a>
                      <span className="text-muted-foreground">- Self-service guides</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              Still need help? Don't hesitate to reach out - we're here to support your FHIR learning journey!
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
              <Link href="/security" className="hover:text-primary">Security Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}