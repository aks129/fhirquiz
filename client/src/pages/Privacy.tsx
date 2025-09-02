import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Shield, Eye, Lock, Database, Mail, Calendar } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
              <Eye className="h-8 w-8 text-primary" />
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground">
              Last updated: January 15, 2024
            </p>
          </div>

          <Card className="mb-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">Our Commitment to Privacy</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 dark:text-blue-200">
              <p>
                FHIR Healthcare Bootcamp is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you use our educational platform.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <p className="mb-2">When you register for our platform, we may collect:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Name and email address</li>
                    <li>Professional information (job title, organization)</li>
                    <li>Educational background and experience level</li>
                    <li>Billing information for paid courses</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Usage Information</h3>
                  <p className="mb-2">We automatically collect information about how you use our platform:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Course progress and completion status</li>
                    <li>Quiz scores and learning analytics</li>
                    <li>Platform interactions and feature usage</li>
                    <li>Device and browser information</li>
                    <li>IP address and general location data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Educational Data</h3>
                  <p className="mb-2">Related to your learning experience:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Lab exercise submissions and results</li>
                    <li>FHIR queries and transformations you create</li>
                    <li>Notes and annotations on course materials</li>
                    <li>Peer interactions and forum participation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Provide Educational Services:</strong> Deliver course content, track progress, and issue certificates</li>
                  <li><strong>Personalize Learning:</strong> Adapt content to your skill level and learning preferences</li>
                  <li><strong>Improve Our Platform:</strong> Analyze usage patterns to enhance features and content</li>
                  <li><strong>Communicate:</strong> Send course updates, support responses, and important announcements</li>
                  <li><strong>Process Payments:</strong> Handle billing and subscription management</li>
                  <li><strong>Ensure Security:</strong> Protect against fraud and unauthorized access</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Healthcare Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Synthetic Data Only</h3>
                  <p className="text-green-800 dark:text-green-200">
                    Our platform exclusively uses synthetic patient data generated by Synthea and other approved synthetic data generators. No real patient data or Protected Health Information (PHI) is ever processed, stored, or transmitted through our platform.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">HIPAA Compliance</h3>
                  <p>
                    While our platform does not handle PHI, we maintain security practices that align with HIPAA standards to ensure the highest level of data protection for all user information.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Data Minimization</h3>
                  <p>
                    We collect only the minimum amount of personal information necessary to provide our educational services and enhance your learning experience.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Information Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
                
                <div>
                  <h3 className="font-semibold mb-2">Service Providers</h3>
                  <p>
                    We may share information with trusted third-party service providers who assist us in operating our platform, conducting our business, or serving our users, provided they agree to keep this information confidential.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Legal Requirements</h3>
                  <p>
                    We may disclose your information when required by law or to protect our rights, property, or safety, or that of our users or others.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Business Transfers</h3>
                  <p>
                    In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>We implement appropriate technical and organizational measures to protect your personal information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Encryption:</strong> Data is encrypted in transit and at rest using industry-standard protocols</li>
                  <li><strong>Access Controls:</strong> Strict access controls limit who can view or modify your information</li>
                  <li><strong>Regular Audits:</strong> We conduct regular security assessments and vulnerability testing</li>
                  <li><strong>Secure Infrastructure:</strong> Our platform is hosted on secure, compliant cloud infrastructure</li>
                  <li><strong>Employee Training:</strong> Our staff receive regular privacy and security training</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Rights and Choices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>You have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                  <li><strong>Portability:</strong> Request a machine-readable copy of your data</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                  <li><strong>Restrict Processing:</strong> Request restriction of how we process your information</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us at <a href="mailto:privacy@fhirbootcamp.com" className="text-primary hover:underline">privacy@fhirbootcamp.com</a>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>We retain your personal information for as long as necessary to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide you with our educational services</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce our agreements</li>
                  <li>Maintain educational records for certification purposes</li>
                </ul>
                <p>
                  When information is no longer needed, we securely delete or anonymize it in accordance with our data retention schedule.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookies and Tracking Technologies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Remember your preferences and settings</li>
                  <li>Analyze platform usage and performance</li>
                  <li>Provide personalized content and features</li>
                  <li>Maintain your login session</li>
                </ul>
                <p>
                  You can control cookie settings through your browser preferences. However, disabling certain cookies may affect platform functionality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>International Data Transfers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    <a href="mailto:privacy@fhirbootcamp.com" className="text-primary hover:underline">
                      privacy@fhirbootcamp.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4" />
                    <span>Data Protection Officer: </span>
                    <a href="mailto:dpo@fhirbootcamp.com" className="text-primary hover:underline">
                      dpo@fhirbootcamp.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-8" />

          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              This privacy policy is effective as of January 15, 2024.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
              <Link href="/security" className="hover:text-primary">Security Policy</Link>
              <Link href="/help" className="hover:text-primary">Help Center</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}