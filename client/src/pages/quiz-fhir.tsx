import { QuizRunner } from "@/components/quiz/quiz-runner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, BookOpen } from "lucide-react";

export function QuizFhir() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/resources" className="no-underline">
            <Button variant="ghost" size="sm" data-testid="button-back-to-resources">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Resources
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">FHIR Fundamentals Quiz</h1>
          </div>
        </div>

        {/* Quiz Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>FHIR Basics Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• This quiz covers fundamental FHIR concepts and terminology</p>
              <p>• Great for beginners or as a refresher on core FHIR principles</p>
              <p>• Covers resource types, bundles, search parameters, and best practices</p>
              <p>• No prerequisites - anyone can take this quiz</p>
              <p>• Perfect preparation before starting the 3-day bootcamp</p>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Component */}
        <QuizRunner 
          quizSlug="fhir-basics" 
          onComplete={(result) => {
            console.log("FHIR basics quiz completed:", result);
          }}
        />

        {/* Help Links */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Want to learn more about FHIR?</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/overview" className="text-blue-600 hover:underline">
                  Bootcamp Overview
                </Link>
                <Link href="/resources" className="text-blue-600 hover:underline">
                  Learning Resources
                </Link>
                <Link href="/day1" className="text-blue-600 hover:underline">
                  Start Day 1 Lab
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}