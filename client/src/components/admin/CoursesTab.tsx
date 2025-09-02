import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Plus, Edit, Trash2, Lock, Unlock } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  is_free: boolean;
  requires_product_sku: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
}

export function CoursesTab() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_free: true,
    requires_product_sku: '',
    is_active: true,
    sort_order: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['/api/admin/courses'],
    retry: false
  });

  // Fetch products for requirements dropdown
  const { data: products = [] } = useQuery({
    queryKey: ['/api/admin/products'],
    retry: false
  });

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/courses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      toast({ title: "Course created successfully" });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create course", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest('PUT', `/api/admin/courses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      toast({ title: "Course updated successfully" });
      setEditingCourse(null);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update course", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      toast({ title: "Course deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete course", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      is_free: true,
      requires_product_sku: '',
      is_active: true,
      sort_order: 0
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setFormData({
      title: course.title,
      description: course.description || '',
      is_free: course.is_free,
      requires_product_sku: course.requires_product_sku || '',
      is_active: course.is_active,
      sort_order: course.sort_order
    });
    setEditingCourse(course);
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      requires_product_sku: formData.requires_product_sku || null
    };

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, ...submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getProductName = (sku: string | null) => {
    if (!sku) return null;
    const product = products.find((p: Product) => p.sku === sku);
    return product?.name || sku;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Management
              </CardTitle>
              <CardDescription>
                Manage bootcamp courses, access requirements, and content visibility
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} data-testid="create-course">
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Courses Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading courses...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Course Title</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Requirements</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses
                  .sort((a: Course, b: Course) => a.sort_order - b.sort_order)
                  .map((course: Course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {course.sort_order}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{course.title}</div>
                          {course.description && (
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {course.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.is_free ? 'default' : 'secondary'}>
                          {course.is_free ? (
                            <>
                              <Unlock className="h-3 w-3 mr-1" />
                              Free
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Paid
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {course.requires_product_sku ? (
                          <div className="space-y-1">
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {course.requires_product_sku}
                            </code>
                            <div className="text-xs text-gray-500">
                              {getProductName(course.requires_product_sku)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.is_active ? 'default' : 'secondary'}>
                          {course.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(course)}
                            data-testid={`edit-course-${course.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteMutation.mutate(course.id)}
                            disabled={deleteMutation.isPending}
                            title="Delete course"
                            data-testid={`delete-course-${course.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && courses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No courses found. Create your first course to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreateDialogOpen || editingCourse !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingCourse(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Update course details and access requirements.' : 'Add a new bootcamp course with access controls.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., FHIR Fundamentals"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Course description..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  sort_order: parseInt(e.target.value) || 0
                }))}
                placeholder="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_free: checked }))}
              />
              <Label htmlFor="is_free">Free Course (no purchase required)</Label>
            </div>
            {!formData.is_free && (
              <div>
                <Label htmlFor="requires_product">Required Product</Label>
                <Select 
                  value={formData.requires_product_sku}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, requires_product_sku: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select required product..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No requirement</SelectItem>
                    {products.map((product: Product) => (
                      <SelectItem key={product.id} value={product.sku}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active (visible to students)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingCourse(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingCourse ? 'Update Course' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}