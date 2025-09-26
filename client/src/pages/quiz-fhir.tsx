import { QuizRunner } from "@/components/quiz/quiz-runner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, Target, BarChart3, Clock, Award } from "lucide-react";

interface QuizFhirProps {
  slug?: string;
}

export function QuizFhir({ slug = "fhir-basics" }: QuizFhirProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={getBackLink(slug)} className="no-underline">
            <Button variant="ghost" size="sm" data-testid={`button-back-from-${slug}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {getBackText(slug)}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {getQuizIcon(slug)}
            <h1 className="text-2xl font-bold">{getQuizTitle(slug)}</h1>
          </div>
        </div>

        {/* Quiz Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{getQuizCardTitle(slug)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              {getQuizInstructions(slug).map((instruction, index) => (
                <p key={index}>• {instruction}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quiz Component */}
        <QuizRunner 
          quizSlug={slug} 
          onComplete={(result) => {
            console.log(`${slug} quiz completed:`, result);
          }}
        />

        {/* Help Links */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">{getHelpText(slug)}</p>
              <div className="flex flex-wrap gap-4">
                {getHelpLinks(slug).map((link, index) => (
                  <Link key={index} href={link.href} className="text-blue-600 hover:underline">
                    {link.text}
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getQuizIcon(slug: string) {
  switch (slug) {
    case "resource-model":
      return <BarChart3 className="w-6 h-6 text-purple-600" />;
    case "api-behavior":
      return <Target className="w-6 h-6 text-green-600" />;
    case "implementation":
      return <Clock className="w-6 h-6 text-orange-600" />;
    case "troubleshooting":
      return <Award className="w-6 h-6 text-red-600" />;
    case "implementation-guides":
      return <BookOpen className="w-6 h-6 text-blue-600" />;
    default:
      return <BookOpen className="w-6 h-6 text-blue-600" />;
  }
}

function getQuizTitle(slug: string) {
  switch (slug) {
    case "resource-model":
      return "Resource Model Quiz";
    case "api-behavior":
      return "API Behavior Quiz";
    case "implementation":
      return "Implementation Quiz";
    case "troubleshooting":
      return "Troubleshooting Quiz";
    case "implementation-guides":
      return "Implementation Guides Quiz";
    default:
      return "FHIR Fundamentals Quiz";
  }
}

function getQuizCardTitle(slug: string) {
  switch (slug) {
    case "resource-model":
      return "Resource Model & Structure Assessment";
    case "api-behavior":
      return "FHIR API Behavior Assessment";
    case "implementation":
      return "Implementation Assessment";
    case "troubleshooting":
      return "Troubleshooting & Validation Assessment";
    case "implementation-guides":
      return "Implementation Guides Assessment";
    default:
      return "FHIR Basics Assessment";
  }
}

function getQuizInstructions(slug: string) {
  switch (slug) {
    case "resource-model":
      return [
        "Resource selection, element suitability, and search parameters",
        "Extensions, terminology, and data types",
        "Practical scenarios for the HL7 FHIR exam",
        "25-33% of the certification exam content"
      ];
    case "api-behavior":
      return [
        "RESTful methods, operations, and capability statements",
        "Bundle processing, search behavior, and security",
        "Practical API implementation scenarios",
        "19-33% of the certification exam content"
      ];
    case "implementation":
      return [
        "Using extensions, elements, and search parameters in practice",
        "Operations, terminology, and real-world implementation",
        "Hands-on scenarios for the HL7 FHIR exam",
        "19-29% of the certification exam content"
      ];
    case "troubleshooting":
      return [
        "Validation errors, REST API errors, and profile rules",
        "Common implementation problems and solutions",
        "Debugging scenarios for the HL7 FHIR exam",
        "13-19% of the certification exam content"
      ];
    case "implementation-guides":
      return [
        "Profile and IG selection based on use cases",
        "Understanding scope, relationships, and constraints",
        "IG navigation and conformance scenarios",
        "4-8% of the certification exam content"
      ];
    default:
      return [
        "This quiz covers fundamental FHIR concepts and terminology",
        "Great for beginners or as a refresher on core FHIR principles",
        "Covers resource types, bundles, search parameters, and best practices",
        "No prerequisites - anyone can take this quiz",
        "Perfect preparation before starting the 3-day bootcamp"
      ];
  }
}

function getBackLink(slug: string) {
  if (["resource-model", "api-behavior", "implementation", "troubleshooting", "implementation-guides"].includes(slug)) {
    return "/study";
  }
  return "/resources";
}

function getBackText(slug: string) {
  if (["resource-model", "api-behavior", "implementation", "troubleshooting", "implementation-guides"].includes(slug)) {
    return "Back to Study Mode";
  }
  return "Back to Resources";
}

function getHelpText(slug: string) {
  if (["resource-model", "api-behavior", "implementation", "troubleshooting", "implementation-guides"].includes(slug)) {
    return "Want to study more before taking the quiz?";
  }
  return "Want to learn more about FHIR?";
}

function getHelpLinks(slug: string) {
  if (["resource-model", "api-behavior", "implementation", "troubleshooting", "implementation-guides"].includes(slug)) {
    return [
      { href: `/study/${slug}`, text: "Study This Competency" },
      { href: "/study", text: "All Study Areas" },
      { href: "/practice-exams", text: "Practice Exams" }
    ];
  }
  return [
    { href: "/overview", text: "Bootcamp Overview" },
    { href: "/resources", text: "Learning Resources" },
    { href: "/lab/day1", text: "Start Day 1 Lab" }
  ];
}