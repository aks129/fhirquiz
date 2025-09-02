import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, GraduationCap, BookOpen, Eye, EyeOff, Settings } from "lucide-react";

import { CourseVisibilityTab } from "@/components/instructor/CourseVisibilityTab";

export default function InstructorDashboard() {
  const { user, profile, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated or not instructor/admin
  useEffect(() => {
    if (!isLoading && (!user || !profile || !['instructor', 'admin'].includes(profile.role))) {
      setLocation("/");
    }
  }, [user, profile, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-instructor">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading instructor dashboard...</span>
        </div>
      </div>
    );
  }

  // Return null while redirecting
  if (!user || !profile || !['instructor', 'admin'].includes(profile.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="instructor-dashboard">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Instructor Dashboard
            </h1>
            <Badge variant={profile.role === 'admin' ? 'destructive' : 'default'} className="ml-2">
              {profile.role === 'admin' ? 'Admin' : 'Instructor'}
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage course content visibility and lab access for the FHIR Healthcare Bootcamp
          </p>
        </div>

        {/* Instructor Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Labs</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Hands-on exercises</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visible Content</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Currently accessible</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hidden Content</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Instructor only</p>
            </CardContent>
          </Card>
        </div>

        {/* Course Visibility Management */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Course Content Visibility
            </CardTitle>
            <CardDescription>
              Control which labs and content are visible to students. Toggle visibility for individual exercises and sections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CourseVisibilityTab />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}