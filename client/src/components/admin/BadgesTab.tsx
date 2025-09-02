import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Award, Plus, Edit, Trash2, Star } from "lucide-react";

interface BadgeType {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  icon_color: string;
  points_reward: number;
  is_active: boolean;
  created_at: string;
}

const ICON_OPTIONS = [
  { name: 'award', label: '🏆 Award' },
  { name: 'star', label: '⭐ Star' },
  { name: 'medal', label: '🏅 Medal' },
  { name: 'crown', label: '👑 Crown' },
  { name: 'trophy', label: '🏆 Trophy' },
  { name: 'gem', label: '💎 Gem' },
  { name: 'shield', label: '🛡️ Shield' },
  { name: 'target', label: '🎯 Target' },
  { name: 'zap', label: '⚡ Lightning' },
  { name: 'flame', label: '🔥 Fire' }
];

const COLOR_OPTIONS = [
  { value: 'gold', label: 'Gold', class: 'text-yellow-500' },
  { value: 'silver', label: 'Silver', class: 'text-gray-400' },
  { value: 'bronze', label: 'Bronze', class: 'text-orange-600' },
  { value: 'blue', label: 'Blue', class: 'text-blue-500' },
  { value: 'green', label: 'Green', class: 'text-green-500' },
  { value: 'purple', label: 'Purple', class: 'text-purple-500' },
  { value: 'red', label: 'Red', class: 'text-red-500' },
  { value: 'orange', label: 'Orange', class: 'text-orange-500' }
];

export function BadgesTab() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_name: 'award',
    icon_color: 'gold',
    points_reward: 100,
    is_active: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch badges
  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['/api/admin/badges'],
    retry: false
  });

  // Create badge mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/badges', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/badges'] });
      toast({ title: "Badge created successfully" });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create badge", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update badge mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest('PUT', `/api/admin/badges/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/badges'] });
      toast({ title: "Badge updated successfully" });
      setEditingBadge(null);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update badge", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete badge mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/badges/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/badges'] });
      toast({ title: "Badge deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete badge", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon_name: 'award',
      icon_color: 'gold',
      points_reward: 100,
      is_active: true
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (badge: BadgeType) => {
    setFormData({
      name: badge.name,
      description: badge.description || '',
      icon_name: badge.icon_name,
      icon_color: badge.icon_color,
      points_reward: badge.points_reward,
      is_active: badge.is_active
    });
    setEditingBadge(badge);
  };

  const handleSubmit = () => {
    if (editingBadge) {
      updateMutation.mutate({ id: editingBadge.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getIconEmoji = (iconName: string) => {
    const icon = ICON_OPTIONS.find(i => i.name === iconName);
    return icon?.label.split(' ')[0] || '🏆';
  };

  const getColorClass = (color: string) => {
    const colorOption = COLOR_OPTIONS.find(c => c.value === color);
    return colorOption?.class || 'text-yellow-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Badge Management
              </CardTitle>
              <CardDescription>
                Create and manage achievement badges with point rewards
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} data-testid="create-badge">
              <Plus className="h-4 w-4 mr-2" />
              Add Badge
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Badges Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading badges...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Badge Name</TableHead>
                  <TableHead>Points Reward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {badges.map((badge: BadgeType) => (
                  <TableRow key={badge.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`text-2xl ${getColorClass(badge.icon_color)}`}>
                          {getIconEmoji(badge.icon_name)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {badge.icon_name} / {badge.icon_color}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{badge.name}</div>
                        {badge.description && (
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {badge.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-mono font-medium">
                          {badge.points_reward}
                        </span>
                        <span className="text-sm text-gray-500">points</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.is_active ? 'default' : 'secondary'}>
                        {badge.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(badge)}
                          data-testid={`edit-badge-${badge.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteMutation.mutate(badge.id)}
                          disabled={deleteMutation.isPending}
                          title="Delete badge"
                          data-testid={`delete-badge-${badge.id}`}
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

          {!isLoading && badges.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No badges found. Create your first achievement badge to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreateDialogOpen || editingBadge !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingBadge(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBadge ? 'Edit Badge' : 'Create New Badge'}
            </DialogTitle>
            <DialogDescription>
              {editingBadge ? 'Update badge details and appearance.' : 'Create a new achievement badge with point rewards.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Badge Preview */}
            <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-center">
                <div className={`text-4xl mb-2 ${getColorClass(formData.icon_color)}`}>
                  {getIconEmoji(formData.icon_name)}
                </div>
                <div className="font-medium">{formData.name || 'Badge Name'}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1 justify-center mt-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  {formData.points_reward} points
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="name">Badge Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., FHIR Expert"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Badge description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon_name">Icon</Label>
                <select
                  id="icon_name"
                  value={formData.icon_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon_name: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {ICON_OPTIONS.map(option => (
                    <option key={option.name} value={option.name}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="icon_color">Color</Label>
                <select
                  id="icon_color"
                  value={formData.icon_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon_color: e.target.value }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {COLOR_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="points_reward">Points Reward</Label>
              <div className="relative">
                <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-yellow-500" />
                <Input
                  id="points_reward"
                  type="number"
                  min="0"
                  step="10"
                  value={formData.points_reward}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    points_reward: parseInt(e.target.value) || 0
                  }))}
                  placeholder="100"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active (can be awarded)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingBadge(null);
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
              {editingBadge ? 'Update Badge' : 'Create Badge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}