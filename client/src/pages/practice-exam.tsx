import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import SEOHead from "@/components/seo-head";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Clock, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  BarChart3, 
  Play, 
  RefreshCw,
  Timer,
  Award
} from "lucide-react";

interface PracticeExamQuestion {
  id: string;
  questionText: string;
  questionType: string;
  explanation?: string;
  order: number;
  competencyArea: string;
  choices: {
    id: string;
    choiceText: string;
    order: number;
  }[];
}

interface PracticeExamData {
  quiz: {
    id: string;
    slug: string;
    title: string;
    description: string;
    timeLimit: number;
    passingScore: number;
    quizType: string;
    questionCount: number;
    competencyDistribution: Record<string, number>;
  };
  questions: PracticeExamQuestion[];
}

interface ExamAnswer {
  questionId: string;
  choiceId: string | string[]; // Support both single and multiple choice
}

export default function PracticeExam() {
  const [currentExam, setCurrentExam] = useState<PracticeExamData | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [examCompleted, setExamCompleted] = useState(false);
  const [examResults, setExamResults] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateExamMutation = useMutation({
    mutationFn: () => fetch("/api/practice-exam/generate").then(res => res.json()),
    onSuccess: (data: PracticeExamData) => {
      setCurrentExam(data);
      setExamStarted(false);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setTimeRemaining(data.quiz.timeLimit * 60); // Convert minutes to seconds
      setExamCompleted(false);
      setExamResults(null);
    },
  });

  const submitExamMutation = useMutation({
    mutationFn: async (submission: { answers: ExamAnswer[]; duration: number }) => {
      const response = await apiRequest("POST", "/api/quiz/practice-exam/grade", submission);
      return response.json();
    },
    onSuccess: (results) => {
      setExamResults(results);
      setExamCompleted(true);
    },
  });

  const startExam = () => {
    if (!currentExam) return;
    setExamStarted(true);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup timer on unmount or when exam completes
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Clear timer when exam completes
  useEffect(() => {
    if (examCompleted && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [examCompleted]);

  const handleAnswerSelection = (questionId: string, choiceId: string) => {
    setAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === questionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { questionId, choiceId };
        return updated;
      }
      return [...prev, { questionId, choiceId }];
    });
  };

  const handleSubmitExam = () => {
    if (!currentExam || timeRemaining === null) return;
    
    const duration = (currentExam.quiz.timeLimit * 60) - (timeRemaining || 0);
    submitExamMutation.mutate({ answers, duration });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCompetencyName = (slug: string) => {
    const names = {
      "implementation-guides": "Implementation Guides",
      "api-behavior": "API Behavior", 
      "resource-model": "Resource Model",
      "implementation": "Implementation",
      "troubleshooting": "Troubleshooting"
    };
    return names[slug as keyof typeof names] || slug;
  };

  const getCompetencyColor = (slug: string) => {
    const colors = {
      "implementation-guides": "bg-blue-100 text-blue-800",
      "api-behavior": "bg-green-100 text-green-800",
      "resource-model": "bg-purple-100 text-purple-800", 
      "implementation": "bg-orange-100 text-orange-800",
      "troubleshooting": "bg-red-100 text-red-800"
    };
    return colors[slug as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const currentQuestion = currentExam?.questions[currentQuestionIndex];
  const progress = currentExam ? ((currentQuestionIndex + 1) / currentExam.questions.length) * 100 : 0;
  const answeredCount = answers.length;

  return (
    <>
      <SEOHead 
        title="FHIR Foundation Practice Exam - Full-Length Certification Prep"
        description="Take a full-length 50-question practice exam that simulates the official HL7 FHIR Implementor Foundation certification exam. 2-hour time limit, 70% passing score."
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-600" />
              <div>
                <h1 className="text-3xl font-bold">Practice Exam</h1>
                <p className="text-muted-foreground">Full-length FHIR Foundation certification simulation</p>
              </div>
            </div>
            <Link href="/study" className="no-underline">
              <Button variant="outline" data-testid="button-back-to-study">
                <BookOpen className="w-4 h-4 mr-2" />
                Back to Study Mode
              </Button>
            </Link>
          </div>

          {!currentExam && (
            <Card className="text-center" data-testid="card-exam-generator">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Target className="w-6 h-6 text-blue-600" />
                  Generate Practice Exam
                </CardTitle>
                <CardDescription>
                  Create a new 50-question practice exam with official competency distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">50</div>
                    <div className="text-sm text-muted-foreground">Questions</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">2 Hours</div>
                    <div className="text-sm text-muted-foreground">Time Limit</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">70%</div>
                    <div className="text-sm text-muted-foreground">To Pass</div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => generateExamMutation.mutate()}
                  disabled={generateExamMutation.isPending}
                  size="lg"
                  data-testid="button-generate-exam"
                >
                  {generateExamMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating Exam...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate New Practice Exam
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {currentExam && !examStarted && (
            <Card data-testid="card-exam-ready">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Exam Ready
                </CardTitle>
                <CardDescription>{currentExam.quiz.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(currentExam.quiz.competencyDistribution).map(([slug, count]) => (
                    <div key={slug} className="text-center">
                      <Badge variant="outline" className={`mb-2 ${getCompetencyColor(slug)}`}>
                        {getCompetencyName(slug)}
                      </Badge>
                      <div className="text-lg font-semibold">{count}</div>
                      <div className="text-xs text-muted-foreground">questions</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={startExam} size="lg" data-testid="button-start-exam">
                    <Play className="w-4 h-4 mr-2" />
                    Start Practice Exam
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => generateExamMutation.mutate()}
                    disabled={generateExamMutation.isPending}
                    data-testid="button-regenerate-exam"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Different Exam
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {examStarted && !examCompleted && currentQuestion && (
            <div className="space-y-6" data-testid="container-exam-in-progress">
              {/* Exam Progress */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">
                        Question {currentQuestionIndex + 1} of {currentExam?.questions.length}
                      </div>
                      <Badge className={getCompetencyColor(currentQuestion.competencyArea)}>
                        {getCompetencyName(currentQuestion.competencyArea)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        Answered: {answeredCount}/{currentExam?.questions.length}
                      </div>
                      {timeRemaining !== null && (
                        <div className={`flex items-center gap-2 ${timeRemaining < 600 ? 'text-red-600' : ''}`}>
                          <Timer className="w-4 h-4" />
                          <span className="font-mono">{formatTime(timeRemaining)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Progress value={progress} className="w-full" data-testid="progress-exam" />
                </CardContent>
              </Card>

              {/* Question */}
              <Card data-testid={`question-${currentQuestionIndex}`}>
                <CardHeader>
                  <CardTitle className="text-lg leading-relaxed">
                    {currentQuestion.questionText}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentQuestion.choices.map((choice) => {
                    const isSelected = answers.find(a => a.questionId === currentQuestion.id)?.choiceId === choice.id;
                    return (
                      <div
                        key={choice.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleAnswerSelection(currentQuestion.id, choice.id)}
                        data-testid={`choice-${choice.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1" />}
                          </div>
                          <span>{choice.choiceText}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  data-testid="button-previous-question"
                >
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {currentQuestionIndex < (currentExam?.questions.length || 0) - 1 ? (
                    <Button
                      onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                      data-testid="button-next-question"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitExam}
                      disabled={submitExamMutation.isPending}
                      data-testid="button-submit-exam"
                    >
                      {submitExamMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Exam"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {examCompleted && examResults && (
            <Card data-testid="card-exam-results">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${
                  examResults.passed ? 'text-green-600' : 'text-red-600'
                }`}>
                  {examResults.passed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                  Exam {examResults.passed ? 'Passed' : 'Failed'}
                </CardTitle>
                <CardDescription>
                  Your score: {examResults.score}% (Need 70% to pass)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{examResults.score}%</div>
                    <div className="text-sm text-muted-foreground">Final Score</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{examResults.correctAnswers || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">Correct Answers</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{Math.floor((examResults.duration || 0) / 60)}m</div>
                    <div className="text-sm text-muted-foreground">Time Taken</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => generateExamMutation.mutate()}
                    disabled={generateExamMutation.isPending}
                    data-testid="button-try-again"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Another Practice Exam
                  </Button>
                  <Link href="/study" className="no-underline">
                    <Button variant="outline" data-testid="button-back-to-study-from-results">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Back to Study Mode
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}