import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle, XCircle, Award } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { QuizData, QuizSubmission, QuizResult } from "@shared/schema";

interface QuizRunnerProps {
  quizSlug: string;
  onComplete?: (result: QuizResult) => void;
}

type QuizState = "loading" | "taking" | "reviewing" | "completed";

export function QuizRunner({ quizSlug, onComplete }: QuizRunnerProps) {
  const [state, setState] = useState<QuizState>("loading");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [challengeMode, setChallengeMode] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: quizData, isLoading } = useQuery<QuizData>({
    queryKey: ["/api/quiz", quizSlug],
    enabled: !!quizSlug
  });

  const gradeQuizMutation = useMutation({
    mutationFn: async (submission: QuizSubmission) => {
      const response = await fetch(`/api/quiz/${quizSlug}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": crypto.randomUUID()
        },
        body: JSON.stringify(submission)
      });
      if (!response.ok) {
        throw new Error(`Failed to grade quiz: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (gradedResult: QuizResult) => {
      console.log("Quiz graded successfully:", gradedResult);
      setResult(gradedResult);
      setState("reviewing");
      
      // Record the attempt
      recordAttemptMutation.mutate({
        answers: Object.entries(answers).map(([questionId, choiceId]) => ({ questionId, choiceId })),
        duration: Math.floor(timeElapsed / 1000),
        score: gradedResult.score,
        passed: gradedResult.passed
      });
    },
    onError: (error) => {
      console.error("Quiz grading failed:", error);
    }
  });

  const recordAttemptMutation = useMutation({
    mutationFn: async (attemptData: any) => {
      const response = await fetch(`/api/quiz/${quizSlug}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": crypto.randomUUID()
        },
        body: JSON.stringify(attemptData)
      });
      if (!response.ok) {
        throw new Error(`Failed to record attempt: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate quiz attempts cache
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
      
      // Store result in localStorage for progress tracking
      const quizResults = JSON.parse(localStorage.getItem("quizResults") || "{}");
      quizResults[quizSlug] = {
        score: result?.score,
        passed: result?.passed,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem("quizResults", JSON.stringify(quizResults));
      
      if (onComplete && result) {
        onComplete(result);
      }
    }
  });

  // Timer effect
  useEffect(() => {
    if (state === "taking" && startTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime.getTime();
        setTimeElapsed(elapsed);
        
        // Check time limit in challenge mode
        if (challengeMode && timeLimit && elapsed >= timeLimit * 1000) {
          handleSubmitQuiz();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state, startTime, challengeMode, timeLimit]);

  const startQuiz = (challenge = false) => {
    setChallengeMode(challenge);
    setTimeLimit(challenge ? 10 * 60 : quizData?.quiz.timeLimit ? quizData.quiz.timeLimit * 60 : null);
    setStartTime(new Date());
    setState("taking");
    
    // Shuffle questions if in challenge mode
    if (challenge && quizData) {
      // Note: In a real implementation, you'd shuffle on the server side
      // For now, we'll keep the original order but this shows where shuffling would go
    }
  };

  const handleAnswerChange = (questionId: string, choiceId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: choiceId
    }));
  };

  const handleSubmitQuiz = () => {
    if (!quizData || !startTime) return;
    
    const submission: QuizSubmission = {
      answers: Object.entries(answers).map(([questionId, choiceId]) => ({ questionId, choiceId })),
      duration: Math.floor(timeElapsed / 1000)
    };
    
    console.log("Submitting quiz:", submission);
    console.log("Current answers:", answers);
    gradeQuizMutation.mutate(submission);
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    if (!timeLimit) return null;
    const remaining = Math.max(0, timeLimit * 1000 - timeElapsed);
    return Math.floor(remaining / 1000);
  };

  const timeRemaining = getTimeRemaining();
  const isTimeWarning = timeRemaining !== null && timeRemaining < 120; // Last 2 minutes

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading quiz...</div>
        </CardContent>
      </Card>
    );
  }

  if (!quizData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Quiz not found</div>
        </CardContent>
      </Card>
    );
  }

  if (state === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            {quizData.quiz.title}
          </CardTitle>
          <p className="text-muted-foreground">{quizData.quiz.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>📝 {quizData.questions.length} questions</div>
            <div>⏱️ {quizData.quiz.timeLimit ? `${quizData.quiz.timeLimit} minutes` : "No time limit"}</div>
            <div>✅ {quizData.quiz.passingScore}% to pass</div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => startQuiz(false)} 
              data-testid="button-start-normal-quiz"
              className="flex-1"
            >
              Start Quiz
            </Button>
            <Button 
              onClick={() => startQuiz(true)} 
              variant="outline"
              data-testid="button-start-challenge-mode"
              className="flex-1"
            >
              Challenge Mode (10 min)
            </Button>
          </div>
          
          {challengeMode && (
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
              ⚡ Challenge Mode: Questions may be shuffled and you have 10 minutes total!
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (state === "taking") {
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
    
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>
              Question {currentQuestionIndex + 1} of {quizData.questions.length}
            </CardTitle>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span data-testid="text-time-elapsed">
                  {formatTime(timeElapsed)}
                  {timeRemaining !== null && (
                    <span className={`ml-2 ${isTimeWarning ? 'text-red-600 font-semibold' : ''}`}>
                      ({Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} left)
                    </span>
                  )}
                </span>
              </div>
              {challengeMode && (
                <Badge variant="secondary" className="mt-1">Challenge Mode</Badge>
              )}
            </div>
          </div>
          <Progress value={progress} />
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 mb-4" data-testid={`text-question-${currentQuestion.id}`}>
              {currentQuestion.questionText}
            </h3>
            
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              className="space-y-3"
            >
              {currentQuestion.choices.map((choice, index) => (
                <div key={choice.id} className="flex items-center space-x-3">
                  <RadioGroupItem 
                    value={choice.id} 
                    id={choice.id}
                    data-testid={`radio-choice-${currentQuestion.id}-${choice.id}`}
                  />
                  <Label 
                    htmlFor={choice.id} 
                    className="flex-1 cursor-pointer"
                    data-testid={`label-choice-${currentQuestion.id}-${choice.id}`}
                  >
                    {choice.choiceText}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              data-testid="button-previous-question"
            >
              Previous
            </Button>
            
            {currentQuestionIndex === quizData.questions.length - 1 ? (
              <Button 
                onClick={handleSubmitQuiz}
                disabled={gradeQuizMutation.isPending}
                data-testid="button-submit-quiz"
              >
                {gradeQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button 
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                data-testid="button-next-question"
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "reviewing" && result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.passed ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            Quiz Results
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6" data-testid="quiz-results-summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold" data-testid="text-final-score">{result.score}%</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{result.correctAnswers}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{result.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatTime(timeElapsed)}</div>
              <div className="text-sm text-muted-foreground">Time</div>
            </div>
          </div>
          
          <div className="text-center">
            <Badge variant={result.passed ? "default" : "destructive"} className="text-base px-4 py-1">
              {result.passed ? "✅ Passed!" : "❌ Did not pass"}
            </Badge>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Question Review</h3>
            {result.feedback.map((feedback, index) => (
              <Card key={feedback.questionId} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    {feedback.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{index + 1}. {feedback.questionText}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className={feedback.isCorrect ? "text-green-600" : "text-red-600"}>
                          Your answer: {feedback.selectedChoice}
                        </span>
                        {!feedback.isCorrect && (
                          <div className="text-green-600">
                            Correct answer: {feedback.correctChoice}
                          </div>
                        )}
                      </div>
                      {feedback.explanation && (
                        <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                          💡 {feedback.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              onClick={() => {
                setState("loading");
                setCurrentQuestionIndex(0);
                setAnswers({});
                setResult(null);
                setStartTime(null);
                setTimeElapsed(0);
              }}
              data-testid="button-retake-quiz"
            >
              Take Quiz Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}