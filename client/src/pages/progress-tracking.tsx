import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import SEOHead from "@/components/seo-head";
import { 
  BookOpen, 
  Target, 
  BarChart3, 
  Clock, 
  Award, 
  TrendingUp,
  TrendingDown,
  Brain,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Timer,
  Zap
} from "lucide-react";

interface CompetencyArea {
  id: string;
  name: string;
  description: string;
  slug: string;
  minPercentage: number;
  maxPercentage: number;
  order: number;
}

interface StudyProgress {
  id: string;
  competencyAreaId: string;
  studyTimeMinutes: number;
  practiceQuestionsAttempted: number;
  practiceQuestionsCorrect: number;
  masteryLevel: "beginner" | "intermediate" | "advanced" | "mastered";
  lastStudiedAt: string;
}

interface ExamAnalytics {
  id: string;
  competencyAreaId: string;
  questionsAttempted: number;
  questionsCorrect: number;
  averageTimePerQuestion: number;
  strengthAreas: string[];
  weaknessAreas: string[];
}

interface CompetencyProgress {
  competencyArea: CompetencyArea;
  studyProgress: StudyProgress | null;
  examAnalytics: ExamAnalytics[];
  overallAccuracy: number;
  totalAttempts: number;
  totalCorrect: number;
  averageStudyTime: number;
  masteryScore: number;
  recommendedActions: string[];
}

export default function ProgressTracking() {
  const { data: competencyAreas = [], isLoading: areasLoading } = useQuery<CompetencyArea[]>({
    queryKey: ["/api/competency-areas"],
  });

  const { data: progressData = [], isLoading: progressLoading } = useQuery<CompetencyProgress[]>({
    queryKey: ["/api/progress/competency-analysis"],
  });

  const isLoading = areasLoading || progressLoading;

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

  const getMasteryColor = (masteryLevel: string) => {
    switch (masteryLevel) {
      case "mastered":
        return "bg-green-100 text-green-800 border-green-200";
      case "advanced":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "beginner":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMasteryIcon = (masteryLevel: string) => {
    switch (masteryLevel) {
      case "mastered":
        return <Trophy className="w-4 h-4" />;
      case "advanced":
        return <TrendingUp className="w-4 h-4" />;
      case "intermediate":
        return <Clock className="w-4 h-4" />;
      case "beginner":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getOverallStats = () => {
    if (!progressData.length) {
      return {
        totalStudyTime: 0,
        overallAccuracy: 0,
        averageMasteryScore: 0,
        readinessScore: 0,
        strongAreas: [],
        weakAreas: []
      };
    }

    const totalStudyTime = progressData.reduce((sum, p) => sum + p.averageStudyTime, 0);
    const totalAttempts = progressData.reduce((sum, p) => sum + p.totalAttempts, 0);
    const totalCorrect = progressData.reduce((sum, p) => sum + p.totalCorrect, 0);
    const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    const averageMasteryScore = progressData.reduce((sum, p) => sum + p.masteryScore, 0) / progressData.length;
    
    // Calculate readiness based on mastery scores and accuracy
    const readinessScore = Math.min(100, (averageMasteryScore * 0.6) + (overallAccuracy * 0.4));
    
    // Identify strong and weak areas
    const strongAreas = progressData
      .filter(p => p.masteryScore >= 80)
      .map(p => p.competencyArea.name);
    
    const weakAreas = progressData
      .filter(p => p.masteryScore < 60)
      .map(p => p.competencyArea.name);

    return {
      totalStudyTime,
      overallAccuracy,
      averageMasteryScore,
      readinessScore,
      strongAreas,
      weakAreas
    };
  };

  const stats = getOverallStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Progress Tracking - FHIR Foundation Exam Prep"
        description="Track your progress across all FHIR competency areas. See detailed analytics, mastery levels, and get personalized study recommendations."
      />
      
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Progress Tracking</h1>
            <p className="text-muted-foreground mt-2">
              Monitor your FHIR Foundation exam preparation across all competency areas
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/study" className="no-underline">
              <Button variant="outline" data-testid="button-study-mode">
                <BookOpen className="w-4 h-4 mr-2" />
                Study Mode
              </Button>
            </Link>
            <Link href="/practice-exam" className="no-underline">
              <Button data-testid="button-practice-exam">
                <Trophy className="w-4 h-4 mr-2" />
                Practice Exam
              </Button>
            </Link>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="overall-stats">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{Math.round(stats.readinessScore)}%</div>
                  <div className="text-sm text-muted-foreground">Exam Readiness</div>
                </div>
                <Trophy className={`w-8 h-8 ${stats.readinessScore >= 70 ? 'text-green-500' : 'text-yellow-500'}`} />
              </div>
              <Progress value={stats.readinessScore} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{Math.round(stats.overallAccuracy)}%</div>
                  <div className="text-sm text-muted-foreground">Overall Accuracy</div>
                </div>
                <Target className={`w-8 h-8 ${stats.overallAccuracy >= 70 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <Progress value={stats.overallAccuracy} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{Math.round(stats.totalStudyTime / 60)}h</div>
                  <div className="text-sm text-muted-foreground">Study Time</div>
                </div>
                <Timer className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {stats.totalStudyTime % 60}m additional
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{Math.round(stats.averageMasteryScore)}%</div>
                  <div className="text-sm text-muted-foreground">Avg Mastery</div>
                </div>
                <Brain className={`w-8 h-8 ${stats.averageMasteryScore >= 80 ? 'text-green-500' : 'text-orange-500'}`} />
              </div>
              <Progress value={stats.averageMasteryScore} className="mt-3" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="competencies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="competencies" data-testid="tab-competencies">Competency Areas</TabsTrigger>
            <TabsTrigger value="insights" data-testid="tab-insights">Insights & Recommendations</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Study History</TabsTrigger>
          </TabsList>

          <TabsContent value="competencies" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {progressData.map((progress) => (
                <Card 
                  key={progress.competencyArea.id} 
                  className="border-l-4 border-l-blue-500"
                  data-testid={`competency-card-${progress.competencyArea.slug}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCompetencyIcon(progress.competencyArea.slug)}
                        <div>
                          <CardTitle className="text-lg">{progress.competencyArea.name}</CardTitle>
                          <CardDescription>
                            {progress.competencyArea.minPercentage}%-{progress.competencyArea.maxPercentage}% of exam
                          </CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getMasteryColor(progress.studyProgress?.masteryLevel || "beginner")}
                      >
                        <div className="flex items-center gap-1">
                          {getMasteryIcon(progress.studyProgress?.masteryLevel || "beginner")}
                          {progress.studyProgress?.masteryLevel || "Not Started"}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Accuracy</div>
                        <div className={`text-lg ${progress.overallAccuracy >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.round(progress.overallAccuracy)}%
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Questions Attempted</div>
                        <div className="text-lg">{progress.totalAttempts}</div>
                      </div>
                      <div>
                        <div className="font-medium">Study Time</div>
                        <div className="text-lg">{Math.round(progress.averageStudyTime / 60)}h {progress.averageStudyTime % 60}m</div>
                      </div>
                      <div>
                        <div className="font-medium">Mastery Score</div>
                        <div className={`text-lg ${progress.masteryScore >= 80 ? 'text-green-600' : progress.masteryScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {Math.round(progress.masteryScore)}%
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-sm mb-2">Mastery Progress</div>
                      <Progress value={progress.masteryScore} className="h-2" />
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/study/${progress.competencyArea.slug}`} className="no-underline flex-1">
                        <Button variant="outline" size="sm" className="w-full" data-testid={`study-${progress.competencyArea.slug}`}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Study
                        </Button>
                      </Link>
                      <Link href={`/quiz/${progress.competencyArea.slug}`} className="no-underline flex-1">
                        <Button size="sm" className="w-full" data-testid={`quiz-${progress.competencyArea.slug}`}>
                          <Target className="w-4 h-4 mr-2" />
                          Practice Quiz
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strong Areas */}
              <Card data-testid="strong-areas-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="w-5 h-5" />
                    Strong Areas
                  </CardTitle>
                  <CardDescription>
                    Competencies where you're performing well
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.strongAreas.length > 0 ? (
                    <div className="space-y-3">
                      {stats.strongAreas.map((area, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{area}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      Keep studying to build strong areas! You're on the right track.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Areas for Improvement */}
              <Card data-testid="weak-areas-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <TrendingDown className="w-5 h-5" />
                    Areas for Improvement
                  </CardTitle>
                  <CardDescription>
                    Competencies that need more attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.weakAreas.length > 0 ? (
                    <div className="space-y-3">
                      {stats.weakAreas.map((area, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span>{area}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      Great job! No major weak areas identified. Keep up the consistent study!
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Personalized Recommendations */}
              <Card className="lg:col-span-2" data-testid="recommendations-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    Personalized Study Recommendations
                  </CardTitle>
                  <CardDescription>
                    Based on your performance and study patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.readinessScore < 70 && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="font-medium text-orange-800 mb-2">Focus on Exam Readiness</div>
                        <div className="text-sm text-orange-700">
                          Your current readiness score is {Math.round(stats.readinessScore)}%. 
                          Aim for 70%+ before taking the actual exam. Consider taking more practice exams.
                        </div>
                      </div>
                    )}
                    
                    {stats.overallAccuracy < 70 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="font-medium text-red-800 mb-2">Improve Question Accuracy</div>
                        <div className="text-sm text-red-700">
                          Your accuracy is {Math.round(stats.overallAccuracy)}%. Focus on understanding concepts 
                          rather than memorizing. Review explanations for incorrect answers.
                        </div>
                      </div>
                    )}

                    {stats.totalStudyTime < 300 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-800 mb-2">Increase Study Time</div>
                        <div className="text-sm text-blue-700">
                          You've studied for {Math.round(stats.totalStudyTime / 60)} hours. 
                          Most successful candidates study 20-40 hours. Consider setting a daily study schedule.
                        </div>
                      </div>
                    )}

                    {stats.readinessScore >= 70 && stats.overallAccuracy >= 70 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-green-800 mb-2">You're Exam Ready!</div>
                        <div className="text-sm text-green-700">
                          Excellent progress! Your readiness score is {Math.round(stats.readinessScore)}% 
                          and accuracy is {Math.round(stats.overallAccuracy)}%. 
                          Consider scheduling your official exam soon.
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card data-testid="study-history-card">
              <CardHeader>
                <CardTitle>Recent Study Activity</CardTitle>
                <CardDescription>
                  Your study sessions and practice quiz attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <div className="text-lg font-medium mb-2">Study History Coming Soon</div>
                  <div className="text-sm">
                    We're working on detailed study session tracking and analytics.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}