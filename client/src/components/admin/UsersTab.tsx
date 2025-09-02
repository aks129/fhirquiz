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
import { Loader2, Search, Shield, GraduationCap, User, Plus, RotateCcw, ExternalLink, Users, ArrowUpDown, ArrowUp, ArrowDown, Edit3, Check, X } from "lucide-react";

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
  const [sortBy, setSortBy] = useState<'created_at' | 'email' | 'role' | 'fhir_points'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [tempPoints, setTempPoints] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all user profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['/api/auth/profiles'],
    retry: false
  });

  // Set user role by email mutation (new endpoint)
  const setRoleMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      return apiRequest('POST', '/api/admin/users/set-role', { email, role });
    },
    onSuccess: (data, variables) => {
      // Optimistic update worked, invalidate cache
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profiles'] });
      toast({ title: "Role updated successfully" });
      setEditingUser(null);
    },
    onError: (error, variables) => {
      // Rollback optimistic update
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profiles'] });
      toast({ 
        title: "Failed to update role", 
        description: error.message,
        variant: "destructive" 
      });
      setEditingUser(null);
    }
  });

  // Update user role mutation (existing endpoint)
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

  // Grant points mutation (new endpoint)
  const grantPointsMutation = useMutation({
    mutationFn: async ({ email, points }: { email: string; points: number }) => {
      return apiRequest('POST', '/api/admin/users/grant-points', { email, points });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profiles'] });
      toast({ title: "Points granted successfully" });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profiles'] });
      toast({ 
        title: "Failed to grant points", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Deduct points mutation (new endpoint)
  const deductPointsMutation = useMutation({
    mutationFn: async ({ email, points }: { email: string; points: number }) => {
      return apiRequest('POST', '/api/admin/users/deduct-points', { email, points });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profiles'] });
      toast({ title: "Points deducted successfully" });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profiles'] });
      toast({ 
        title: "Failed to deduct points", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Add points mutation (existing endpoint)
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

  // Filter and sort profiles
  const filteredProfiles = profiles
    .filter((profile: Profile) => 
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: Profile, b: Profile) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'fhir_points':
          aValue = a.fhir_points || 0;
          bValue = b.fhir_points || 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

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

  // Inline role editing with optimistic UI
  const handleInlineRoleChange = (profile: Profile, newRole: 'student' | 'instructor' | 'admin') => {
    if (!profile.email) return;
    
    // Optimistic update
    const optimisticData = profiles.map((p: Profile) => 
      p.id === profile.id ? { ...p, role: newRole } : p
    );
    queryClient.setQueryData(['/api/auth/profiles'], optimisticData);
    
    // Send request
    setRoleMutation.mutate({ email: profile.email, role: newRole });
  };

  // Inline points management
  const handleGrantPoints = (profile: Profile, points: number) => {
    if (!profile.email || points <= 0) return;
    
    // Optimistic update
    const optimisticData = profiles.map((p: Profile) => 
      p.id === profile.id ? { ...p, fhir_points: (p.fhir_points || 0) + points } : p
    );
    queryClient.setQueryData(['/api/auth/profiles'], optimisticData);
    
    grantPointsMutation.mutate({ email: profile.email, points });
  };

  const handleDeductPoints = (profile: Profile, points: number) => {
    if (!profile.email || points <= 0) return;
    
    // Optimistic update
    const optimisticData = profiles.map((p: Profile) => 
      p.id === profile.id ? { ...p, fhir_points: Math.max(0, (p.fhir_points || 0) - points) } : p
    );
    queryClient.setQueryData(['/api/auth/profiles'], optimisticData);
    
    deductPointsMutation.mutate({ email: profile.email, points });
  };

  const handleSort = (column: 'created_at' | 'email' | 'role' | 'fhir_points') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
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
          {/* Search and Sort */}
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
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Joined</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="fhir_points">FHIR Points</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              data-testid="sort-order"
            >
              {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
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
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      {sortBy === 'email' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-2">
                      Role
                      {sortBy === 'role' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort('fhir_points')}
                  >
                    <div className="flex items-center gap-2">
                      FHIR Points
                      {sortBy === 'fhir_points' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Joined
                      {sortBy === 'created_at' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Quick Actions</TableHead>
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
                      {editingUser === profile.id ? (
                        <div className="flex items-center gap-2">
                          <Select 
                            value={tempRole} 
                            onValueChange={(value: any) => setTempRole(value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="instructor">Instructor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              handleInlineRoleChange(profile, tempRole);
                            }}
                            data-testid={`save-role-${profile.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingUser(null)}
                            data-testid={`cancel-role-${profile.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getRoleBadgeVariant(profile.role)}
                            className="flex items-center gap-1 w-fit"
                          >
                            {getRoleIcon(profile.role)}
                            {profile.role}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingUser(profile.id);
                              setTempRole(profile.role);
                            }}
                            data-testid={`edit-role-${profile.id}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{profile.fhir_points}</span>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGrantPoints(profile, 25)}
                            disabled={!profile.email}
                            title="Grant 25 points"
                            data-testid={`grant-points-${profile.id}`}
                          >
                            +25
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeductPoints(profile, 10)}
                            disabled={!profile.email || (profile.fhir_points || 0) < 10}
                            title="Deduct 10 points"
                            data-testid={`deduct-points-${profile.id}`}
                          >
                            -10
                          </Button>
                        </div>
                      </div>
                    </TableCell>
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