import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  Mail, 
  Calendar, 
  Award, 
  Star, 
  ShoppingBag, 
  CreditCard,
  Download,
  Trophy,
  ExternalLink,
  MessageCircle
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'student' | 'instructor' | 'admin';
  fhir_points: number;
  created_at: string;
  updated_at: string;
}

interface Purchase {
  id: string;
  product_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface Certificate {
  id: string;
  course_name: string;
  issued_date: string;
  certificate_url: string;
}

interface Badge {
  id: string;
  title: string;
  description: string;
  earned_date: string;
  icon: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['/api/auth/me'],
    enabled: !!user,
  });

  // Fetch purchases
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ['/api/billing/purchases'],
    enabled: !!user,
    retry: false
  });

  // Fetch certificates
  const { data: certificates = [], isLoading: certificatesLoading } = useQuery<Certificate[]>({
    queryKey: ['/api/certificates'],
    enabled: !!user,
    retry: false
  });

  // Fetch badges
  const { data: badges = [], isLoading: badgesLoading } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
    enabled: !!user,
    retry: false
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: { full_name: string }) => {
      return await apiRequest('PATCH', '/api/auth/profile', updatedData);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
        variant: "default"
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Billing portal mutation  
  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/billing/portal');
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Portal opened",
        description: "Billing portal opened in new tab.",
        variant: "default"
      });
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error) => {
      toast({
        title: "Portal error",
        description: error.message || "Failed to open billing portal.",
        variant: "destructive"
      });
    }
  });

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditedName(profile?.full_name || "");
    } else {
      setIsEditing(true);
      setEditedName(profile?.full_name || "");
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate({ full_name: editedName });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert>
          <AlertDescription>
            Please sign in to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Profile Header */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-primary-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          placeholder="Enter your full name"
                          className="text-lg font-semibold"
                        />
                      ) : (
                        <h1 className="text-2xl font-bold">
                          {profile?.full_name || 'Anonymous User'}
                        </h1>
                      )}
                      <Badge variant={profile?.role === 'admin' ? 'destructive' : profile?.role === 'instructor' ? 'default' : 'secondary'}>
                        {profile?.role}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{profile?.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {formatDate(profile?.created_at || '')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <Button 
                        onClick={handleSave} 
                        disabled={updateProfileMutation.isPending}
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        onClick={handleEditToggle} 
                        variant="outline" 
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEditToggle} variant="outline" size="sm">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
                  <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {profile?.fhir_points || 0}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">FHIR Points</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
                  <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {certificates.length}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Certificates</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 rounded-lg">
                  <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {badges.length}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Badges</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Tabs */}
        <Tabs defaultValue="purchases" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5" />
                  <span>Purchase History</span>
                </CardTitle>
                <Button 
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing Portal
                </Button>
              </CardHeader>
              <CardContent>
                {purchasesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    <p>Loading purchases...</p>
                  </div>
                ) : purchases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No purchases yet</p>
                    <p className="text-sm">Visit our catalog to browse available courses</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{purchase.product_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(purchase.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(purchase.amount, purchase.currency)}
                          </div>
                          <Badge variant={purchase.status === 'paid' ? 'default' : 'secondary'}>
                            {purchase.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Certificates</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certificatesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    <p>Loading certificates...</p>
                  </div>
                ) : certificates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No certificates earned yet</p>
                    <p className="text-sm">Complete courses to earn certificates</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificates.map((certificate) => (
                      <div key={certificate.id} className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                        <div className="flex items-center justify-between mb-3">
                          <Award className="w-8 h-8 text-green-600" />
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                          {certificate.course_name}
                        </h4>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Issued {formatDate(certificate.issued_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Achievement Badges</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {badgesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    <p>Loading badges...</p>
                  </div>
                ) : badges.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No badges earned yet</p>
                    <p className="text-sm">Complete labs and challenges to earn badges</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {badges.map((badge) => (
                      <div key={badge.id} className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">{badge.icon}</span>
                          </div>
                          <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-1">
                            {badge.title}
                          </h4>
                          <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                            {badge.description}
                          </p>
                          <p className="text-xs text-purple-500 dark:text-purple-500">
                            Earned {formatDate(badge.earned_date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Support & Help</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Contact Support */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Support</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => window.location.href = 'mailto:support@fhirbootcamp.com?subject=Support Request&body=Hello, I need help with...'}
                      className="h-auto p-4 flex flex-col items-start space-y-2"
                      variant="outline"
                    >
                      <div className="flex items-center space-x-2">
                        <Mail className="w-5 h-5" />
                        <span className="font-semibold">Email Support</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Get help via email within 24 hours
                      </span>
                    </Button>
                    
                    <Button 
                      onClick={() => portalMutation.mutate()}
                      disabled={portalMutation.isPending}
                      className="h-auto p-4 flex flex-col items-start space-y-2"
                      variant="outline"
                    >
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-5 h-5" />
                        <span className="font-semibold">Billing Support</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Manage payments and subscriptions
                      </span>
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Account Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account ID:</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs">{profile?.id}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{profile?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant="outline">{profile?.role}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member since:</span>
                      <span>{formatDate(profile?.created_at || '')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}