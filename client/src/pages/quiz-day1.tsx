import { QuizRunner } from "@/components/quiz/quiz-runner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, BookOpen } from "lucide-react";

export function QuizDay1() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/lab/day1" className="no-underline">
            <Button variant="ghost" size="sm" data-testid="button-back-to-day1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Day 1
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Day 1 Quiz: FHIR Data Ingestion</h1>
          </div>
        </div>

        {/* Quiz Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Before You Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Review the Day 1 lab materials if you haven't completed them yet</p>
              <p>• This quiz covers FHIR bundles, data ingestion, identifiers, and CSV exports</p>
              <p>• You need 80% to pass and unlock Day 2</p>
              <p>• You can retake the quiz as many times as needed</p>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Component */}
        <QuizRunner 
          quizSlug="day1" 
          onComplete={(result) => {
            // Quiz completion is handled by the component itself
            // The component stores results in localStorage and backend
            console.log("Day 1 quiz completed:", result);
          }}
        />

        {/* Help Links */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Need help? Review these resources:</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/lab/day1" className="text-blue-600 hover:underline">
                  Day 1 Lab Materials
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