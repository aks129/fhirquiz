import { QuizRunner } from "@/components/quiz/quiz-runner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, Lock } from "lucide-react";
import { useEffect, useState } from "react";

export function QuizDay3() {
  const [day2Passed, setDay2Passed] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if Day 2 quiz was passed
    const quizResults = JSON.parse(localStorage.getItem("quizResults") || "{}");
    const day2Result = quizResults["day2"];
    setDay2Passed(day2Result?.passed || false);
  }, []);

  if (day2Passed === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!day2Passed) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/lab/day3" className="no-underline">
              <Button variant="ghost" size="sm" data-testid="button-back-to-day3">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Day 3
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Lock className="w-6 h-6 text-gray-400" />
              <h1 className="text-2xl font-bold text-gray-400">Day 3 Quiz: Locked</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-500" />
                Quiz Locked
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You need to pass the Day 2 quiz with 80% or higher to unlock the Day 3 quiz.</p>
              
              <div className="flex gap-3">
                <Link href="/quiz/day2" className="no-underline">
                  <Button data-testid="button-take-day2-quiz">
                    Take Day 2 Quiz
                  </Button>
                </Link>
                <Link href="/lab/day2" className="no-underline">
                  <Button variant="outline" data-testid="button-review-day2">
                    Review Day 2 Materials
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/day3" className="no-underline">
            <Button variant="ghost" size="sm" data-testid="button-back-to-day3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Day 3
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Day 3 Quiz: Data Operationalization</h1>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Unlocked
            </Badge>
          </div>
        </div>

        {/* Quiz Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Before You Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Review the Day 3 lab materials covering Observation creation and FHIR publishing</p>
              <p>• This quiz covers publishing results back to FHIR, CapabilityStatement, and best practices</p>
              <p>• Most advanced quiz - covers real-world implementation challenges</p>
              <p>• Passing this quiz completes the core bootcamp curriculum!</p>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Component */}
        <QuizRunner 
          quizSlug="day3" 
          onComplete={(result) => {
            console.log("Day 3 quiz completed:", result);
          }}
        />

        {/* Help Links */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Need help? Review these resources:</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/lab/day3" className="text-blue-600 hover:underline">
                  Day 3 Lab Materials
                </Link>
                <Link href="/resources" className="text-blue-600 hover:underline">
                  FHIR Learning Resources
                </Link>
                <Link href="/troubleshooting" className="text-blue-600 hover:underline">
                  Troubleshooting Guide
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}