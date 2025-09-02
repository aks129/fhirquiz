import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Eye, EyeOff, Lock, Unlock, Users, Clock } from "lucide-react";

interface LabContent {
  id: string;
  title: string;
  description: string;
  day: number;
  step: number;
  is_visible: boolean;
  requires_authentication: boolean;
  estimated_minutes: number;
  content_type: 'lab' | 'quiz' | 'resource' | 'byod';
}

interface DayGroup {
  day: number;
  title: string;
  labs: LabContent[];
}

export function CourseVisibilityTab() {
  const [updatingLab, setUpdatingLab] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch lab content
  const { data: labContent = [], isLoading } = useQuery({
    queryKey: ['/api/instructor/content'],
    retry: false
  });

  // Update visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ labId, isVisible }: { labId: string; isVisible: boolean }) => {
      return apiRequest('PUT', `/api/instructor/content/${labId}/visibility`, { 
        is_visible: isVisible 
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/content'] });
      toast({ 
        title: variables.isVisible ? "Content made visible" : "Content hidden",
        description: "Students will see the updated visibility immediately."
      });
      setUpdatingLab(null);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update visibility", 
        description: error.message,
        variant: "destructive" 
      });
      setUpdatingLab(null);
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ day, isVisible }: { day: number; isVisible: boolean }) => {
      return apiRequest('PUT', `/api/instructor/content/bulk-visibility`, { 
        day,
        is_visible: isVisible 
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/content'] });
      toast({ 
        title: variables.isVisible ? "Day content made visible" : "Day content hidden",
        description: `All Day ${variables.day} content visibility updated.`
      });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to bulk update", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleVisibilityToggle = async (labId: string, isVisible: boolean) => {
    setUpdatingLab(labId);
    updateVisibilityMutation.mutate({ labId, isVisible });
  };

  const handleBulkToggle = async (day: number, isVisible: boolean) => {
    bulkUpdateMutation.mutate({ day, isVisible });
  };

  // Group labs by day
  const dayGroups: DayGroup[] = labContent.reduce((groups: DayGroup[], lab: LabContent) => {
    const existingGroup = groups.find(g => g.day === lab.day);
    if (existingGroup) {
      existingGroup.labs.push(lab);
    } else {
      groups.push({
        day: lab.day,
        title: `Day ${lab.day}: FHIR ${lab.day === 1 ? 'Data Ingestion' : lab.day === 2 ? 'Data Transformation & Analytics' : 'Data Operationalization'}`,
        labs: [lab]
      });
    }
    return groups;
  }, []).sort((a, b) => a.day - b.day);

  // Sort labs within each day
  dayGroups.forEach(group => {
    group.labs.sort((a, b) => a.step - b.step);
  });

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return '📝';
      case 'resource': return '📚';
      case 'byod': return '🚀';
      default: return '🧪';
    }
  };

  const getContentTypeBadge = (type: string) => {
    switch (type) {
      case 'quiz': return <Badge variant="secondary">Quiz</Badge>;
      case 'resource': return <Badge variant="outline">Resource</Badge>;
      case 'byod': return <Badge variant="default">BYOD</Badge>;
      default: return <Badge variant="default">Lab</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading course content...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visible Content</p>
                <p className="text-2xl font-bold">
                  {labContent.filter((lab: LabContent) => lab.is_visible).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hidden Content</p>
                <p className="text-2xl font-bold">
                  {labContent.filter((lab: LabContent) => !lab.is_visible).length}
                </p>
              </div>
              <EyeOff className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content by Day */}
      <Accordion type="multiple" defaultValue={dayGroups.map(g => `day-${g.day}`)} className="w-full">
        {dayGroups.map((dayGroup) => {
          const visibleCount = dayGroup.labs.filter(lab => lab.is_visible).length;
          const totalCount = dayGroup.labs.length;
          const allVisible = visibleCount === totalCount;
          const noneVisible = visibleCount === 0;

          return (
            <AccordionItem key={`day-${dayGroup.day}`} value={`day-${dayGroup.day}`}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-4 w-full">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <span className="font-semibold">{dayGroup.title}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto mr-4">
                    <Badge variant={allVisible ? 'default' : noneVisible ? 'secondary' : 'outline'}>
                      {visibleCount}/{totalCount} visible
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleBulkToggle(dayGroup.day, !allVisible);
                      }}
                      disabled={bulkUpdateMutation.isPending}
                      data-testid={`bulk-toggle-day-${dayGroup.day}`}
                    >
                      {allVisible ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide All
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show All
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  {dayGroup.labs.map((lab) => (
                    <Card key={lab.id} className={lab.is_visible ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700'}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-xl">{getContentTypeIcon(lab.content_type)}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-base">{lab.title}</CardTitle>
                                {getContentTypeBadge(lab.content_type)}
                                {lab.requires_authentication && (
                                  <Badge variant="outline" className="text-xs">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Auth Required
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {lab.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {lab.estimated_minutes} min
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono">Step {lab.step}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {lab.is_visible ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              )}
                              <Switch
                                checked={lab.is_visible}
                                onCheckedChange={(checked) => handleVisibilityToggle(lab.id, checked)}
                                disabled={updatingLab === lab.id || updateVisibilityMutation.isPending}
                                data-testid={`visibility-toggle-${lab.id}`}
                              />
                              {updatingLab === lab.id && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {dayGroups.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No course content found. Lab content will appear here once available.
        </div>
      )}
    </div>
  );
}