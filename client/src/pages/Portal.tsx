import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { useSessionStore } from "@/stores/sessionStore";
import DemoBanner from "@/components/demo-banner";
import { OnboardingTour } from "@/components/onboarding-tour";
import { 
  BookOpen, 
  CheckCircle, 
  Award, 
  Download, 
  Upload,
  Play,
  Star,
  Trophy,
  Target,
  FileText,
  Server,
  FlaskConical,
  Eye
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalLabs: number;
  completedLabs: number;
  status: 'not_started' | 'in_progress' | 'completed';
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface QuickStartItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  action?: () => void;
}

export default function Portal() {
  const { user, profile, isDemoMode } = useSessionStore();
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('onboarding-completed'));

  // Mock courses data (in real app, this would come from API)
  const courses: Course[] = [
    {
      id: 'fhir-bootcamp-basic',
      title: 'FHIR Bootcamp - 3 Day Intensive',
      description: 'Master FHIR data ingestion, transformation, and operationalization',
      progress: isDemoMode ? 65 : 0,
      totalLabs: 12,
      completedLabs: isDemoMode ? 8 : 0,
      status: isDemoMode ? 'in_progress' : 'not_started',
      estimatedTime: '24 hours',
      difficulty: 'Intermediate'
    },
    {
      id: 'fhir-fundamentals',
      title: 'FHIR Fundamentals',
      description: 'Essential concepts and terminology for healthcare interoperability',
      progress: isDemoMode ? 100 : 0,
      totalLabs: 6,
      completedLabs: isDemoMode ? 6 : 0,
      status: isDemoMode ? 'completed' : 'not_started',
      estimatedTime: '8 hours',
      difficulty: 'Beginner'
    },
    {
      id: 'advanced-fhir',
      title: 'Advanced FHIR Implementation',
      description: 'Complex workflows, security, and enterprise integration patterns',
      progress: 0,
      totalLabs: 15,
      completedLabs: 0,
      status: 'not_started',
      estimatedTime: '32 hours',
      difficulty: 'Advanced'
    }
  ];

  const quickStartItems: QuickStartItem[] = [
    {
      id: 'server-select',
      title: 'Select FHIR Server',
      description: 'Choose your preferred test server for labs',
      completed: isDemoMode ? true : false,
      icon: <Server className="w-4 h-4" />,
      action: () => window.location.href = '/bootcamp?step=server-setup'
    },
    {
      id: 'day1-lab',
      title: 'Complete Day 1 Lab',
      description: 'Upload your first FHIR bundle and explore the data',
      completed: isDemoMode ? true : false,
      icon: <FlaskConical className="w-4 h-4" />,
      action: () => window.location.href = '/bootcamp/day1'
    },
    {
      id: 'pass-quiz',
      title: 'Pass First Quiz',
      description: 'Test your knowledge of FHIR fundamentals',
      completed: isDemoMode ? true : false,
      icon: <CheckCircle className="w-4 h-4" />,
      action: () => window.location.href = '/quiz/fhir-fundamentals'
    },
    {
      id: 'publish-observation',
      title: 'Publish Observation',
      description: 'Create and publish your first FHIR observation',
      completed: isDemoMode ? false : false,
      icon: <Upload className="w-4 h-4" />,
      action: () => window.location.href = '/bootcamp/day3'
    }
  ];

  const badges = isDemoMode ? [
    { id: 'first-upload', name: 'First Upload', description: 'Uploaded your first FHIR bundle', earned: true, date: '2024-01-15' },
    { id: 'quiz-master', name: 'Quiz Master', description: 'Passed 3 quizzes in a row', earned: true, date: '2024-01-20' },
    { id: 'data-explorer', name: 'Data Explorer', description: 'Completed SQL transformation lab', earned: true, date: '2024-01-22' }
  ] : [];

  const certificates = isDemoMode ? [
    { id: 'fhir-fundamentals', name: 'FHIR Fundamentals Certificate', issueDate: '2024-01-25', downloadUrl: '/api/certificates/fhir-fundamentals.pdf' }
  ] : [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'in_progress': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="portal-page">
      <DemoBanner />
      
      {showOnboarding && (
        <OnboardingTour onComplete={() => {
          localStorage.setItem('onboarding-completed', 'true');
          setShowOnboarding(false);
        }} />
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="welcome-title">
            Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Student'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Continue your FHIR learning journey. You have {profile?.fhir_points || 0} FHIR points.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <Card data-testid="my-courses-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  My Courses
                </CardTitle>
                <CardDescription>
                  Track your progress and continue learning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4 space-y-3" data-testid={`course-card-${course.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{course.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getDifficultyColor(course.difficulty)}>
                            {course.difficulty}
                          </Badge>
                          <span className="text-xs text-gray-500">{course.estimatedTime}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getStatusColor(course.status)}`}>
                          {course.status === 'completed' ? 'Completed' : 
                           course.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">
                          {course.completedLabs} of {course.totalLabs} labs completed
                        </span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        variant={course.status === 'not_started' ? 'default' : 'outline'}
                        data-testid={`continue-course-${course.id}`}
                        onClick={() => {
                          if (course.id === 'fhir-bootcamp-basic') {
                            window.location.href = '/bootcamp';
                          } else if (course.id === 'fhir-fundamentals') {
                            window.location.href = '/quiz/fhir-fundamentals';
                          }
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {course.status === 'not_started' ? 'Start Course' : 
                         course.status === 'completed' ? 'Review' : 'Continue'}
                      </Button>
                      {course.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Award className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Start Checklist */}
          <div className="space-y-6">
            <Card data-testid="quick-start-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Quick Start Checklist
                </CardTitle>
                <CardDescription>
                  Essential steps to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickStartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" data-testid={`checklist-item-${item.id}`}>
                    <Checkbox 
                      checked={item.completed} 
                      disabled={isDemoMode && !item.completed}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <h4 className="font-medium text-sm">{item.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{item.description}</p>
                      {item.action && !item.completed && (
                        <Button size="sm" variant="ghost" className="h-6 px-2 mt-2 text-xs" onClick={item.action}>
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* FHIR Points & Badges */}
            <Card data-testid="points-badges-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  FHIR Points & Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="fhir-points">
                    {profile?.fhir_points || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">FHIR Points</div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Recent Badges</h4>
                  {badges.length > 0 ? (
                    <div className="space-y-2">
                      {badges.slice(0, 3).map((badge) => (
                        <div key={badge.id} className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg" data-testid={`badge-${badge.id}`}>
                          <Trophy className="w-4 h-4 text-yellow-600" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs">{badge.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">{badge.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No badges earned yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Certificates */}
            <Card data-testid="certificates-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certificates.length > 0 ? (
                  <div className="space-y-2">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`certificate-${cert.id}`}>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{cert.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Issued: {cert.issueDate}</div>
                        </div>
                        <Button size="sm" variant="outline" data-testid={`download-certificate-${cert.id}`}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No certificates earned yet</p>
                )}
              </CardContent>
            </Card>

            {/* BYOD Quick Entry */}
            <Card data-testid="byod-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  BYOD Quick Entry
                </CardTitle>
                <CardDescription>
                  Bring Your Own Data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="outline"
                  data-testid="byod-upload-button"
                  onClick={() => window.location.href = '/byod'}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}