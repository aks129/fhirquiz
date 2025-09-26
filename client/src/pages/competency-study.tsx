import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import SEOHead from "@/components/seo-head";
import { BookOpen, Target, BarChart3, Clock, Award, CheckCircle, ArrowLeft } from "lucide-react";

interface CompetencyArea {
  id: string;
  name: string;
  description: string;
  slug: string;
  minPercentage: number;
  maxPercentage: number;
  order: number;
}

interface Quiz {
  id: string;
  slug: string;
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  competencyAreaId?: string;
}

interface QuizData {
  quiz: Quiz;
  questions: any[];
}

export default function CompetencyStudy() {
  const [, params] = useRoute("/study/:slug");
  const slug = params?.slug;

  const { data: competencyArea, isLoading: competencyLoading } = useQuery<CompetencyArea>({
    queryKey: [`/api/competency-areas/${slug}`],
    enabled: !!slug,
  });

  const { data: quizData, isLoading: quizLoading } = useQuery<QuizData>({
    queryKey: [`/api/quiz/${slug}`],
    enabled: !!slug,
  });

  const quiz = quizData?.quiz;

  const getCompetencyIcon = (slug: string) => {
    switch (slug) {
      case "implementation-guides":
        return <BookOpen className="w-8 h-8 text-blue-500" />;
      case "api-behavior":
        return <Target className="w-8 h-8 text-green-500" />;
      case "resource-model":
        return <BarChart3 className="w-8 h-8 text-purple-500" />;
      case "implementation":
        return <Clock className="w-8 h-8 text-orange-500" />;
      case "troubleshooting":
        return <Award className="w-8 h-8 text-red-500" />;
      default:
        return <BookOpen className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStudyContent = (slug: string) => {
    switch (slug) {
      case "implementation-guides":
        return {
          keyTopics: [
            "Purpose and scope of FHIR Implementation Guides",
            "Profile selection based on use cases",
            "Understanding profile hierarchies and inheritance",
            "IG dependencies and version management",
            "Canonical URLs and global identifiers",
            "mustSupport interpretation in different IGs"
          ],
          learningObjectives: [
            "Select appropriate profiles and implementation guides for specific use cases",
            "Understand the relationship between profiles and base FHIR resources",
            "Navigate IG documentation and conformance resources",
            "Apply IG constraints in practical implementations"
          ],
          practicalExamples: [
            "Choosing between US Core and disease-specific IGs",
            "Understanding profile constraint inheritance",
            "Working with canonical URLs and references",
            "Implementing mustSupport requirements"
          ]
        };
      case "api-behavior":
        return {
          keyTopics: [
            "RESTful FHIR operations (CRUD)",
            "HTTP methods and status codes",
            "Conditional operations (create, update, delete)",
            "Transaction vs batch bundles",
            "Search parameters and modifiers",
            "Capability statements and server discovery",
            "OAuth 2.0 and SMART on FHIR security"
          ],
          learningObjectives: [
            "Implement proper HTTP operations for FHIR resources",
            "Use conditional operations to prevent duplicates",
            "Design efficient search strategies",
            "Handle transaction bundles for atomic operations",
            "Implement proper authorization flows"
          ],
          practicalExamples: [
            "Conditional create using If-None-Exist",
            "Optimistic locking with ETags",
            "Pagination with Bundle links",
            "SMART app authorization flows"
          ]
        };
      case "resource-model":
        return {
          keyTopics: [
            "FHIR resource structure and cardinality",
            "Data types: Coding vs CodeableConcept",
            "References and contained resources",
            "Identifiers vs resource IDs",
            "Extensions and when to use them",
            "Terminology binding strengths",
            "Search parameters and their usage"
          ],
          learningObjectives: [
            "Select appropriate FHIR resources for data representation",
            "Understand element cardinality and constraints",
            "Use identifiers and references correctly",
            "Apply extensions when core elements are insufficient",
            "Work with coded elements and value sets"
          ],
          practicalExamples: [
            "Patient identifiers for different systems",
            "Observation categories and components",
            "Reference resolution in bundles",
            "Extension design and usage"
          ]
        };
      case "implementation":
        return {
          keyTopics: [
            "Practical use of extensions in profiles",
            "Terminology server integration",
            "Custom search parameter implementation",
            "FHIR operation design and parameters",
            "Bulk data processing strategies",
            "Error handling and validation",
            "Security labels and access control"
          ],
          learningObjectives: [
            "Implement extensions following best practices",
            "Integrate with terminology services",
            "Design and implement custom operations",
            "Handle bulk data import/export efficiently",
            "Implement proper error handling and validation"
          ],
          practicalExamples: [
            "Creating StructureDefinitions for extensions",
            "Using $validate-code for terminology",
            "Batch bundle processing strategies",
            "Subscription criteria design"
          ]
        };
      case "troubleshooting":
        return {
          keyTopics: [
            "FHIR validation errors and invariants",
            "HTTP error codes and their meanings",
            "Profile constraint violations",
            "Reference resolution failures",
            "Terminology validation errors",
            "Bundle processing errors",
            "OperationOutcome interpretation"
          ],
          learningObjectives: [
            "Diagnose and fix validation errors",
            "Understand common HTTP error scenarios",
            "Resolve profile conformance issues",
            "Debug reference and terminology problems",
            "Interpret OperationOutcome severity levels"
          ],
          practicalExamples: [
            "Fixing cardinality constraint violations",
            "Resolving circular reference errors",
            "Debugging slice discriminator failures",
            "Handling conditional update precondition failures"
          ]
        };
      default:
        return {
          keyTopics: [],
          learningObjectives: [],
          practicalExamples: []
        };
    }
  };

  if (competencyLoading || quizLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!competencyArea) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-foreground mb-4">Competency Area Not Found</h1>
        <Link href="/study">
          <Button>Return to Study Mode</Button>
        </Link>
      </div>
    );
  }

  const studyContent = getStudyContent(slug || "");

  return (
    <div className="space-y-8">
      <SEOHead 
        title={`${competencyArea.name} - FHIR Exam Study`}
        description={`Study ${competencyArea.name} for the HL7 FHIR Implementor Foundational exam. ${competencyArea.description}`}
      />

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
          {getCompetencyIcon(slug || "")}
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {competencyArea.name}
            </h1>
            <Badge variant="secondary" className="mt-2">
              {competencyArea.minPercentage}%-{competencyArea.maxPercentage}% of exam
            </Badge>
          </div>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {competencyArea.description}
        </p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Your Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Study Progress</span>
            <span className="font-medium">0%</span>
          </div>
          <Progress value={0} className="h-3" />
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="flex-1" data-testid={`start-studying-${slug}`}>
              <BookOpen className="w-4 h-4 mr-2" />
              Start Studying
            </Button>
            {quiz && (
              <Link href={`/quiz/${quiz.slug}`} className="flex-1">
                <Button variant="outline" className="w-full" data-testid={`practice-quiz-${slug}`}>
                  <Target className="w-4 h-4 mr-2" />
                  Practice Quiz ({quiz.timeLimit}min)
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Study Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Key Topics</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Objectives</CardTitle>
              <CardDescription>
                What you'll be able to do after studying this competency area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {studyContent.learningObjectives.map((objective, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Topics to Master</CardTitle>
              <CardDescription>
                Essential concepts tested in this competency area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyContent.keyTopics.map((topic, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm">{topic}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Practical Examples</CardTitle>
              <CardDescription>
                Real-world scenarios you'll encounter on the exam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studyContent.practicalExamples.map((example, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4 py-2">
                    <h4 className="font-medium mb-1">Example {index + 1}</h4>
                    <p className="text-sm text-muted-foreground">{example}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Study Resources</CardTitle>
              <CardDescription>
                Official documentation and additional materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Official FHIR Specification</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    The authoritative source for FHIR concepts and implementation guidance.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://hl7.org/fhir/R4/" target="_blank" rel="noopener noreferrer">
                      Visit FHIR R4 Spec
                    </a>
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">HL7 FHIR University</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Free online courses and learning materials from HL7.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://www.hl7.org/fhir/R4/index.html" target="_blank" rel="noopener noreferrer">
                      Explore Courses
                    </a>
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Implementation Guides</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Real-world examples of FHIR implementation guides and profiles.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://fhir.org/guides/registry/" target="_blank" rel="noopener noreferrer">
                      Browse IG Registry
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}