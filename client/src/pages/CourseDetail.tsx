import { useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAccess } from "@/hooks/useAccess";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock,
  Users,
  Award,
  CheckCircle,
  Play,
  BookOpen,
  Target,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Calendar,
  FileText,
  Upload,
  BarChart
} from "lucide-react";

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  originalPrice?: number;
  isFree: boolean;
  requiresProduct: string | null;
  instructor: string;
  students: number;
  rating: number;
  outcomes: string[];
  prerequisites: string[];
  syllabus: {
    title: string;
    description: string;
    duration: string;
    topics: string[];
  }[];
}

const courses: Record<string, Course> = {
  'fhir-101': {
    id: 'fhir-101',
    slug: 'fhir-101',
    title: 'FHIR 101: Healthcare Interoperability Fundamentals',
    description: 'Master the basics of FHIR and healthcare data exchange with hands-on exercises and real-world examples.',
    duration: '4-6 hours',
    level: 'Beginner',
    price: 0,
    isFree: true,
    requiresProduct: null,
    instructor: 'Dr. Sarah Chen',
    students: 2847,
    rating: 4.8,
    outcomes: [
      'Understand FHIR architecture and core concepts',
      'Navigate FHIR resources and data structures',
      'Perform basic FHIR API operations',
      'Implement simple healthcare data exchanges'
    ],
    prerequisites: [
      'Basic understanding of healthcare concepts',
      'Familiarity with APIs and web technologies',
      'No prior FHIR experience required'
    ],
    syllabus: [
      {
        title: 'Introduction to FHIR',
        description: 'Learn what FHIR is and why it matters in healthcare',
        duration: '45 minutes',
        topics: [
          'Healthcare interoperability challenges',
          'FHIR history and development',
          'Core principles and benefits',
          'FHIR vs other healthcare standards'
        ]
      },
      {
        title: 'FHIR Resources & Data Model',
        description: 'Explore FHIR resources and how healthcare data is structured',
        duration: '90 minutes',
        topics: [
          'Patient, Practitioner, and Organization resources',
          'Clinical resources (Observation, Condition, Procedure)',
          'Resource relationships and references',
          'FHIR data types and extensions'
        ]
      },
      {
        title: 'FHIR API Basics',
        description: 'Hands-on practice with FHIR API operations',
        duration: '120 minutes',
        topics: [
          'RESTful FHIR operations (Create, Read, Update, Delete)',
          'Search parameters and filtering',
          'Bundle operations and transactions',
          'Error handling and validation'
        ]
      }
    ]
  },
  'health-data-bootcamp': {
    id: 'health-data-bootcamp',
    slug: 'health-data-bootcamp',
    title: 'Health Data Bootcamp: 3-Day Intensive Program',
    description: 'Comprehensive hands-on training covering FHIR data ingestion, transformation, analytics, and operationalization.',
    duration: '24 hours',
    level: 'Intermediate',
    price: 299,
    originalPrice: 399,
    isFree: false,
    requiresProduct: 'fhir-bootcamp-basic',
    instructor: 'Team of Healthcare IT Experts',
    students: 1243,
    rating: 4.9,
    outcomes: [
      'Ingest and process real healthcare data using FHIR',
      'Transform raw data into actionable insights',
      'Build analytics dashboards and reports',
      'Deploy FHIR solutions to production environments',
      'Implement data quality and validation processes'
    ],
    prerequisites: [
      'Basic FHIR knowledge (FHIR 101 recommended)',
      'Some experience with APIs and databases',
      'Basic programming knowledge helpful but not required',
      'Healthcare or technical background preferred'
    ],
    syllabus: [
      {
        title: 'Day 1: FHIR Data Ingestion',
        description: 'Learn to collect, validate, and store FHIR data from multiple sources',
        duration: '8 hours',
        topics: [
          'Setting up FHIR servers and test environments',
          'Data ingestion patterns and best practices',
          'Working with synthetic patient data (Synthea)',
          'Bundle validation and error handling',
          'Lab: Upload and process your first FHIR dataset'
        ]
      },
      {
        title: 'Day 2: Data Transformation & Analytics',
        description: 'Transform FHIR data for analytics and build meaningful insights',
        duration: '8 hours',
        topics: [
          'FHIR to SQL transformation techniques',
          'Building data pipelines and ETL processes',
          'Risk scoring and clinical calculations',
          'Data visualization and reporting',
          'Lab: Create patient risk assessment dashboard'
        ]
      },
      {
        title: 'Day 3: Operationalization & Publishing',
        description: 'Deploy insights back to FHIR servers and production systems',
        duration: '8 hours',
        topics: [
          'Creating and publishing FHIR observations',
          'Implementing clinical decision support',
          'Integration with EHR systems',
          'Security, privacy, and compliance considerations',
          'Lab: Deploy your analytics as FHIR services'
        ]
      },
      {
        title: 'BYOD Workshop',
        description: 'Bring Your Own Data - work with your organization\'s healthcare data',
        duration: 'Self-paced',
        topics: [
          'Data privacy and de-identification',
          'Custom data mapping and transformation',
          'Organization-specific use cases',
          'Production deployment strategies'
        ]
      }
    ]
  },
  'fhir-deep-dive': {
    id: 'fhir-deep-dive',
    slug: 'fhir-deep-dive',
    title: 'FHIR Deep Dive: Advanced Implementation Patterns',
    description: 'Master advanced FHIR concepts including complex workflows, security patterns, and enterprise integration.',
    duration: '16 hours',
    level: 'Advanced',
    price: 499,
    originalPrice: 699,
    isFree: false,
    requiresProduct: 'fhir-bootcamp-plus',
    instructor: 'Senior Healthcare Architects',
    students: 542,
    rating: 4.7,
    outcomes: [
      'Implement complex FHIR workflows and operations',
      'Design secure, scalable FHIR architectures',
      'Master FHIR security and authorization patterns',
      'Build production-ready enterprise integrations',
      'Optimize FHIR performance and scalability'
    ],
    prerequisites: [
      'Completion of Health Data Bootcamp or equivalent experience',
      'Strong technical background in API development',
      'Experience with healthcare systems and workflows',
      'Understanding of security and compliance requirements'
    ],
    syllabus: [
      {
        title: 'Advanced FHIR Operations',
        description: 'Complex workflows, bulk operations, and advanced search patterns',
        duration: '4 hours',
        topics: [
          'Bulk data export and import operations',
          'Complex search and filtering strategies',
          'Conditional operations and optimistic locking',
          'Custom operations and extended functionality'
        ]
      },
      {
        title: 'FHIR Security & Authorization',
        description: 'Implement robust security for healthcare data exchange',
        duration: '4 hours',
        topics: [
          'OAuth 2.0 and SMART on FHIR authorization',
          'Patient consent and access control',
          'Audit logging and compliance tracking',
          'Data encryption and secure transport'
        ]
      },
      {
        title: 'Enterprise Integration Patterns',
        description: 'Design scalable FHIR solutions for large organizations',
        duration: '4 hours',
        topics: [
          'Microservices architecture with FHIR',
          'Event-driven integration patterns',
          'API gateway and service mesh deployment',
          'Multi-tenant FHIR implementations'
        ]
      },
      {
        title: 'Performance & Scalability',
        description: 'Optimize FHIR implementations for production workloads',
        duration: '4 hours',
        topics: [
          'Database optimization for FHIR storage',
          'Caching strategies and CDN deployment',
          'Load balancing and horizontal scaling',
          'Monitoring and observability best practices'
        ]
      }
    ]
  }
};

export default function CourseDetail() {
  const { courseSlug } = useParams();
  const course = courseSlug ? courses[courseSlug] : null;
  const { canAccess, reason, isLoading: accessLoading, purchase, trialEndsAt } = useAccess(courseSlug || '');
  const { toast } = useToast();
  const [enrolling, setEnrolling] = useState(false);

  const createCheckoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          priceId,
          trialDays: 7 // Offer 7-day free trial
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Enrollment Error",
        description: error.message,
        variant: "destructive"
      });
      setEnrolling(false);
    }
  });

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The course you're looking for doesn't exist.</p>
          <Link href="/catalog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleEnroll = async () => {
    setEnrolling(true);
    
    if (course.isFree) {
      // For free courses, just redirect to course content
      window.location.href = `/course/${course.slug}/start`;
    } else {
      // For paid courses, create checkout session
      const productPriceMap = {
        'fhir-bootcamp-basic': 'price_basic_id', // Replace with actual Stripe price IDs
        'fhir-bootcamp-plus': 'price_plus_id'
      };
      
      const priceId = productPriceMap[course.requiresProduct as keyof typeof productPriceMap];
      if (priceId) {
        createCheckoutMutation.mutate(priceId);
      } else {
        toast({
          title: "Configuration Error",
          description: "Course pricing not configured. Please contact support.",
          variant: "destructive"
        });
        setEnrolling(false);
      }
    }
  };

  const getCTAButton = () => {
    if (accessLoading) {
      return (
        <Button disabled className="w-full md:w-auto">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Checking Access...
        </Button>
      );
    }

    if (canAccess) {
      if (reason === 'trial_active' && trialEndsAt) {
        const trialEnd = new Date(trialEndsAt);
        const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return (
          <div className="space-y-2 w-full md:w-auto">
            <Button className="w-full md:w-auto" onClick={() => window.location.href = `/course/${course.slug}/start`}>
              <Play className="w-4 h-4 mr-2" />
              Continue Learning
            </Button>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
            </p>
          </div>
        );
      }
      
      return (
        <Button className="w-full md:w-auto" onClick={() => window.location.href = `/course/${course.slug}/start`}>
          <Play className="w-4 h-4 mr-2" />
          {reason === 'purchased' ? 'Continue Learning' : 'Start Course'}
        </Button>
      );
    }

    if (course.isFree) {
      return (
        <Button 
          className="w-full md:w-auto" 
          onClick={handleEnroll}
          disabled={enrolling}
        >
          {enrolling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <BookOpen className="w-4 h-4 mr-2" />
          Enroll Now (Free)
        </Button>
      );
    }

    return (
      <Button 
        className="w-full md:w-auto" 
        onClick={handleEnroll}
        disabled={enrolling}
      >
        {enrolling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Start Free Trial
      </Button>
    );
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid={`course-detail-${course.slug}`}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Back Navigation */}
        <div>
          <Link href="/catalog">
            <Button variant="ghost" className="p-0" data-testid="back-to-catalog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
          </Link>
        </div>

        {/* Course Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={getLevelColor(course.level)}>
                  {course.level}
                </Badge>
                {course.isFree && (
                  <Badge variant="secondary">Free</Badge>
                )}
                {!course.isFree && course.originalPrice && (
                  <Badge variant="outline" className="text-green-600">
                    Save ${course.originalPrice - course.price}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4" data-testid="course-title">
                {course.title}
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6" data-testid="course-description">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.students.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>{course.rating}/5.0 rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>By {course.instructor}</span>
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="space-y-8">
              {/* Learning Outcomes */}
              <Card data-testid="learning-outcomes">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    What You'll Learn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {course.outcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Prerequisites */}
              <Card data-testid="prerequisites">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Prerequisites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.prerequisites.map((prerequisite, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        <span>{prerequisite}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Syllabus */}
              <Card data-testid="course-syllabus">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Course Syllabus
                  </CardTitle>
                  <CardDescription>
                    Detailed breakdown of course modules and topics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {course.syllabus.map((module, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{module.title}</h3>
                        <Badge variant="outline">{module.duration}</Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{module.description}</p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Topics Covered:</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {module.topics.map((topic, topicIndex) => (
                            <li key={topicIndex} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-3 h-3 text-green-600 mt-1 flex-shrink-0" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6" data-testid="enrollment-card">
              <CardHeader className="text-center">
                {!course.isFree && (
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-blue-600">
                      ${course.price}
                      {course.originalPrice && (
                        <span className="text-lg text-gray-400 line-through ml-2">
                          ${course.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      7-day free trial included
                    </div>
                  </div>
                )}
                
                {course.isFree && (
                  <div className="text-3xl font-bold text-green-600">
                    Free Course
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {getCTAButton()}
                
                <Separator />
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Duration:</span>
                    <span className="font-medium">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Level:</span>
                    <Badge className={getLevelColor(course.level)} variant="secondary">
                      {course.level}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Students:</span>
                    <span className="font-medium">{course.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Rating:</span>
                    <span className="font-medium">{course.rating}/5.0</span>
                  </div>
                </div>

                {canAccess && reason === 'trial_active' && trialEndsAt && (
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      <strong>Free Trial Active</strong>
                      <p>Your trial ends on {new Date(trialEndsAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}