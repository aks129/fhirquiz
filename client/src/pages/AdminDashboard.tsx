import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Users, Package, BookOpen, CreditCard, Award, Settings } from "lucide-react";

import { UsersTab } from "@/components/admin/UsersTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { CoursesTab } from "@/components/admin/CoursesTab";
import { BillingTab } from "@/components/admin/BillingTab";
import { BadgesTab } from "@/components/admin/BadgesTab";
import { FeatureFlagsTab } from "@/components/admin/FeatureFlagsTab";

export default function AdminDashboard() {
  const { user, profile, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [, setLocation] = useLocation();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!user || !profile || profile.role !== 'admin')) {
      setLocation("/");
    }
  }, [user, profile, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-admin">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  // Return null while redirecting
  if (!user || !profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="admin-dashboard">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <Badge variant="destructive" className="ml-2">
              Admin Only
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, products, courses, billing, and badges for the FHIR Healthcare Bootcamp
          </p>
        </div>

        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">All registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Available for purchase</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$-</div>
              <p className="text-xs text-muted-foreground">All-time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badges Awarded</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Total achievements</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Card className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Badges
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Features
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6" data-testid="admin-users-tab">
              <UsersTab />
            </TabsContent>

            <TabsContent value="products" className="mt-6" data-testid="admin-products-tab">
              <ProductsTab />
            </TabsContent>

            <TabsContent value="courses" className="mt-6" data-testid="admin-courses-tab">
              <CoursesTab />
            </TabsContent>

            <TabsContent value="billing" className="mt-6" data-testid="admin-billing-tab">
              <BillingTab />
            </TabsContent>

            <TabsContent value="badges" className="mt-6" data-testid="admin-badges-tab">
              <BadgesTab />
            </TabsContent>

            <TabsContent value="features" className="mt-6" data-testid="admin-features-tab">
              <FeatureFlagsTab />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}