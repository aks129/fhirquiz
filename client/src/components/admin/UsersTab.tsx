import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Shield, GraduationCap, User, Plus, RotateCcw, ExternalLink, Users } from "lucide-react";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'student' | 'instructor' | 'admin';
  fhir_points: number;
  created_at: string;
  avatar_url: string | null;
}

export function UsersTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [pointsToAdd, setPointsToAdd] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all user profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['/api/auth/profiles'],
    retry: false
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest('POST', '/api/admin/users/role', { userId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profiles'] });
      toast({ title: "Role updated successfully" });
      setIsRoleDialogOpen(false);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update role", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Add points mutation
  const addPointsMutation = useMutation({
    mutationFn: async ({ userId, points }: { userId: string; points: number }) => {
      return apiRequest('POST', '/api/admin/users/points', { userId, points });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profiles'] });
      toast({ title: "Points updated successfully" });
      setIsPointsDialogOpen(false);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update points", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Send reset password email
  const sendResetMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('POST', '/api/admin/users/reset-password', { email });
    },
    onSuccess: () => {
      toast({ title: "Password reset email sent" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to send reset email", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Filter profiles based on search
  const filteredProfiles = profiles.filter((profile: Profile) => 
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'instructor': return <GraduationCap className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive' as const;
      case 'instructor': return 'default' as const;
      default: return 'secondary' as const;
    }
  };

  const handleRoleUpdate = () => {
    if (selectedUser) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  const handlePointsUpdate = () => {
    if (selectedUser) {
      addPointsMutation.mutate({ userId: selectedUser.id, points: pointsToAdd });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user roles, points, and account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-users"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredProfiles.length} user{filteredProfiles.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>FHIR Points</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile: Profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.full_name || 'User'} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <span className="font-medium">
                          {profile.full_name || 'Anonymous'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{profile.email || 'No email'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={getRoleBadgeVariant(profile.role)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getRoleIcon(profile.role)}
                        {profile.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{profile.fhir_points}</TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {/* Role Change */}
                        <Dialog open={isRoleDialogOpen && selectedUser?.id === profile.id}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(profile);
                                setNewRole(profile.role);
                                setIsRoleDialogOpen(true);
                              }}
                              data-testid={`change-role-${profile.id}`}
                            >
                              {getRoleIcon(profile.role)}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change User Role</DialogTitle>
                              <DialogDescription>
                                Update role for {profile.full_name || profile.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="role">New Role</Label>
                                <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="student">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Student
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="instructor">
                                      <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4" />
                                        Instructor
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="admin">
                                      <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Admin
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsRoleDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleRoleUpdate}
                                disabled={updateRoleMutation.isPending}
                              >
                                {updateRoleMutation.isPending && (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                )}
                                Update Role
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Add/Remove Points */}
                        <Dialog open={isPointsDialogOpen && selectedUser?.id === profile.id}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(profile);
                                setPointsToAdd(0);
                                setIsPointsDialogOpen(true);
                              }}
                              data-testid={`manage-points-${profile.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage FHIR Points</DialogTitle>
                              <DialogDescription>
                                Add or remove points for {profile.full_name || profile.email}
                                <br />
                                Current points: <span className="font-mono">{profile.fhir_points}</span>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="points">Points to Add (use negative to remove)</Label>
                                <Input
                                  id="points"
                                  type="number"
                                  value={pointsToAdd}
                                  onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                                  placeholder="Enter points..."
                                />
                              </div>
                              <div className="text-sm text-gray-500">
                                New total: {profile.fhir_points + pointsToAdd}
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsPointsDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handlePointsUpdate}
                                disabled={addPointsMutation.isPending}
                              >
                                {addPointsMutation.isPending && (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                )}
                                Update Points
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Reset Password */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => profile.email && sendResetMutation.mutate(profile.email)}
                          disabled={!profile.email || sendResetMutation.isPending}
                          title="Send password reset email"
                          data-testid={`reset-password-${profile.id}`}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>

                        {/* View in Supabase */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                          title="View in Supabase Dashboard"
                        >
                          <a 
                            href={`${process.env.VITE_SUPABASE_URL?.replace('supabase.co', 'supabase.co/dashboard/project')}/auth/users`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            data-testid={`view-supabase-${profile.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}