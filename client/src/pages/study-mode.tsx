import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import SEOHead from "@/components/seo-head";
import { BookOpen, Target, BarChart3, Clock, Award } from "lucide-react";

interface CompetencyArea {
  id: string;
  name: string;
  description: string;
  slug: string;
  minPercentage: number;
  maxPercentage: number;
  order: number;
}

export default function StudyMode() {
  const { data: competencyAreas = [], isLoading } = useQuery<CompetencyArea[]>({
    queryKey: ["/api/competency-areas"],
  });

  const sortedAreas = competencyAreas.sort((a, b) => a.order - b.order);

  const getCompetencyIcon = (slug: string) => {
    switch (slug) {
      case "implementation-guides":
        return <BookOpen className="w-6 h-6 text-blue-500" />;
      case "api-behavior":
        return <Target className="w-6 h-6 text-green-500" />;
      case "resource-model":
        return <BarChart3 className="w-6 h-6 text-purple-500" />;
      case "implementation":
        return <Clock className="w-6 h-6 text-orange-500" />;
      case "troubleshooting":
        return <Award className="w-6 h-6 text-red-500" />;
      default:
        return <BookOpen className="w-6 h-6 text-gray-500" />;
    }
  };

  const getCompetencyColor = (slug: string) => {
    switch (slug) {
      case "implementation-guides":
        return "border-blue-200 bg-blue-50";
      case "api-behavior":
        return "border-green-200 bg-green-50";
      case "resource-model":
        return "border-purple-200 bg-purple-50";
      case "implementation":
        return "border-orange-200 bg-orange-50";
      case "troubleshooting":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SEOHead 
        title="FHIR Exam Study Mode - HL7 FHIR Implementor Foundational"
        description="Study for the HL7 FHIR Implementor Foundational certification exam with competency-based learning modules."
      />

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          HL7 FHIR Exam Study Mode
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Master the 5 competency areas tested in the HL7 FHIR Implementor Foundational certification exam. 
          Study at your own pace with interactive content and practice questions.
        </p>
        
        <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground mt-6">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>2 hours exam time</span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>50 questions</span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4" />
            <span>70% passing score</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAreas.map((area) => (
          <Card 
            key={area.id} 
            className={`h-full transition-all hover:shadow-md hover:scale-105 ${getCompetencyColor(area.slug)}`}
            data-testid={`competency-card-${area.slug}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getCompetencyIcon(area.slug)}
                  <div>
                    <CardTitle className="text-lg leading-tight">{area.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {area.minPercentage}%-{area.maxPercentage}% of exam
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="text-sm leading-relaxed">
                {area.description}
              </CardDescription>
              
              {/* TODO: Add actual progress tracking */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Study Progress</span>
                  <span className="font-medium">0%</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
              
              <div className="flex flex-col space-y-2">
                <Link href={`/study/${area.slug}`}>
                  <Button className="w-full" data-testid={`study-${area.slug}`}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Study Content
                  </Button>
                </Link>
                
                <Link href={`/quiz/${area.slug}`}>
                  <Button variant="outline" className="w-full" data-testid={`quiz-${area.slug}`}>
                    <Target className="w-4 h-4 mr-2" />
                    Practice Quiz
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">Ready for Full Practice Exams?</h2>
        <p className="text-muted-foreground mb-4">
          Once you've studied each competency area, test your knowledge with full-length practice exams 
          that mirror the actual certification format.
        </p>
        <Link href="/practice-exams">
          <Button size="lg" data-testid="practice-exams-link">
            <Award className="w-5 h-5 mr-2" />
            Take Practice Exams
          </Button>
        </Link>
      </div>
    </div>
  );
}