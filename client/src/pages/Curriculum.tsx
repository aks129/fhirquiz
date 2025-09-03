import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  Clock,
  Users,
  Award,
  CheckCircle,
  Play,
  BookOpen,
  Target,
  TrendingUp,
  ArrowRight,
  Calendar,
  FileText,
  Upload,
  BarChart,
  Database,
  Share2
} from "lucide-react";
import { StartTrialCta } from "@/components/common/CtaButton";

export default function Curriculum() {
  const weeks = [
    {
      title: "Weeks 1-4: Healthcare Interoperability Foundations",
      duration: "32 hours",
      description: "Master the fundamentals of healthcare data exchange, HL7 v2.x messaging, and FHIR architecture.",
      topics: [
        "Healthcare Industry Overview & Interoperability Challenges",
        "HL7 v2.x Standards & Message Structure",
        "FHIR Architecture & Resource Model",
        "RESTful APIs in Healthcare",
        "Patient Data Privacy & Security (HIPAA Compliance)",
        "Healthcare Terminologies (SNOMED, LOINC, ICD-10)",
        "Data Exchange Patterns & Integration Scenarios",
        "Hands-on: First FHIR Server Setup"
      ],
      labs: [
        "Set up development environment with HAPI FHIR",
        "Create and validate HL7 v2.x messages",
        "Explore FHIR resources using Postman",
        "Build your first FHIR client application"
      ],
      capstone: "Design a hospital data migration strategy from HL7 v2.x to FHIR"
    },
    {
      title: "Weeks 5-8: API Development & Data Pipelines",
      duration: "32 hours", 
      description: "Build production-ready FHIR APIs and automated data processing pipelines.",
      topics: [
        "Advanced FHIR Search & Filtering",
        "Bundle Operations & Batch Processing",
        "Custom FHIR Extensions & Profiles",
        "Authentication & Authorization (OAuth 2.0, SMART on FHIR)",
        "Data Validation & Quality Assurance",
        "ETL Processes for Healthcare Data",
        "Error Handling & Monitoring",
        "Performance Optimization & Caching"
      ],
      labs: [
        "Implement FHIR search with complex parameters",
        "Build automated data ingestion pipeline",
        "Create custom FHIR profiles for specialty care",
        "Develop authentication middleware"
      ],
      capstone: "Clinical Dashboard - Real-time patient data visualization with automated alerts"
    },
    {
      title: "Weeks 9-12: Production Systems & Capstone",
      duration: "32 hours",
      description: "Deploy enterprise-grade solutions and complete industry-relevant capstone projects.",
      topics: [
        "Deployment Strategies & DevOps",
        "Scalability & Load Balancing",
        "Disaster Recovery & Backup Strategies",
        "Compliance & Audit Logging",
        "Integration with EHR Systems",
        "Mobile Health (mHealth) Applications",
        "AI/ML Integration with FHIR Data",
        "Industry Trends & Future of Interoperability"
      ],
      labs: [
        "Deploy FHIR server to cloud infrastructure",
        "Implement comprehensive logging and monitoring",
        "Build mobile-responsive patient portal",
        "Create ML models for risk prediction"
      ],
      capstone: "Choose from 5 industry-aligned projects: Hospital Integration Hub, Research Data Pipeline, Patient Engagement Portal, Clinical Decision Support System, or Population Health Analytics Platform"
    }
  ];

  const projectOptions = [
    {
      title: "Hospital Data Migration Hub",
      description: "Build a comprehensive system to migrate legacy HL7 v2.x data to FHIR R4, including real-time validation and rollback capabilities.",
      skills: ["Data Migration", "ETL Processes", "Legacy System Integration"],
      duration: "4 weeks",
      difficulty: "Advanced"
    },
    {
      title: "Clinical Research Data Pipeline", 
      description: "Develop an automated pipeline for clinical trial data collection, anonymization, and FHIR-compliant data sharing.",
      skills: ["Data Privacy", "Research Protocols", "Automated Processing"],
      duration: "4 weeks",
      difficulty: "Advanced"
    },
    {
      title: "Patient Engagement Portal",
      description: "Create a patient-facing web application with appointment scheduling, health records access, and care plan management.",
      skills: ["Frontend Development", "User Experience", "Patient Privacy"],
      duration: "4 weeks", 
      difficulty: "Intermediate"
    },
    {
      title: "Interoperability Testing Hub",
      description: "Build a comprehensive testing suite for FHIR server compliance, including automated testing and certification workflows.",
      skills: ["Quality Assurance", "Test Automation", "Compliance"],
      duration: "4 weeks",
      difficulty: "Advanced"
    },
    {
      title: "Population Health Analytics",
      description: "Develop a population health monitoring system with predictive analytics and public health reporting capabilities.",
      skills: ["Data Analytics", "Machine Learning", "Public Health"],
      duration: "4 weeks",
      difficulty: "Expert"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">FHIR Healthcare Bootcamp Curriculum</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            A comprehensive 12-week program designed to transform you into a healthcare interoperability expert. 
            Master FHIR, HL7, and industry-standard tools through hands-on projects and real-world scenarios.
          </p>
          
          {/* Program Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-semibold">96 Total Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold">12 Weeks</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold">5 Capstone Options</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold">Industry Mentorship</span>
            </div>
          </div>
        </div>

        {/* Learning Model */}
        <Card className="mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Flipped Classroom Model</CardTitle>
            <CardDescription className="text-base">
              Maximize your learning with our proven educational approach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-950 rounded-full w-fit">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Pre-Class Study</h3>
                <p className="text-sm text-muted-foreground">3 hours of guided reading, videos, and concept review</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-950 rounded-full w-fit">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Live Lab Sessions</h3>
                <p className="text-sm text-muted-foreground">5 hours of hands-on coding and project work</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 bg-purple-100 dark:bg-purple-950 rounded-full w-fit">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Project Application</h3>
                <p className="text-sm text-muted-foreground">Apply concepts to real industry scenarios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Breakdown */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Weekly Curriculum Breakdown</h2>
          <div className="space-y-8">
            {weeks.map((week, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{week.title}</CardTitle>
                      <CardDescription className="text-base mt-2">
                        {week.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-4">
                      {week.duration}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Core Topics */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Core Topics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {week.topics.map((topic, topicIndex) => (
                        <div key={topicIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Hands-on Labs */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Hands-on Labs
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {week.labs.map((lab, labIndex) => (
                        <div key={labIndex} className="flex items-center gap-2 text-sm">
                          <Play className="h-3 w-3 text-blue-600 flex-shrink-0" />
                          <span>{lab}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Capstone Project */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Week Capstone
                    </h4>
                    <p className="text-sm text-muted-foreground">{week.capstone}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Capstone Project Options */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-4">Final Capstone Project Options</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose from 5 industry-aligned capstone projects designed in partnership with leading healthcare organizations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectOptions.slice(0, 3).map((project, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{project.duration}</Badge>
                    <Badge variant={project.difficulty === 'Expert' ? 'destructive' : project.difficulty === 'Advanced' ? 'default' : 'secondary'}>
                      {project.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Key Skills:</h5>
                    <div className="flex flex-wrap gap-1">
                      {project.skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Additional Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {projectOptions.slice(3).map((project, index) => (
              <Card key={index + 3} className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{project.duration}</Badge>
                    <Badge variant={project.difficulty === 'Expert' ? 'destructive' : project.difficulty === 'Advanced' ? 'default' : 'secondary'}>
                      {project.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Key Skills:</h5>
                    <div className="flex flex-wrap gap-1">
                      {project.skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Industry Partnerships */}
        <Card className="mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Industry Partnerships</CardTitle>
            <CardDescription>
              Curriculum developed with leading healthcare technology organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4">
                <div className="text-2xl font-bold text-primary mb-2">Epic</div>
                <p className="text-xs text-muted-foreground">EHR Integration</p>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-primary mb-2">Cerner</div>
                <p className="text-xs text-muted-foreground">Health Records</p>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-primary mb-2">HL7 FHIR</div>
                <p className="text-xs text-muted-foreground">Standards Body</p>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-primary mb-2">SMART</div>
                <p className="text-xs text-muted-foreground">Health IT</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Your Healthcare IT Career?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join thousands of professionals who have transformed their careers through our comprehensive FHIR bootcamp. 
                Get hands-on experience with real healthcare data and industry-standard tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <StartTrialCta size="lg" className="min-w-[200px]" />
                <Link href="/demo">
                  <Button variant="outline" size="lg" className="min-w-[200px]">
                    <Play className="h-4 w-4 mr-2" />
                    Try Live Demo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}