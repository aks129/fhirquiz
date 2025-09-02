import type { Express } from "express";
import { requireAdmin, requireInstructorOrAdmin } from "./auth";

export function registerAdminRoutes(app: Express) {
  
  // ===== ADMIN USER MANAGEMENT =====
  
  // Set user role by email (admin only) - NEW ENDPOINT
  app.post("/api/admin/users/set-role", requireAdmin, async (req, res) => {
    try {
      const { email, role } = req.body;
      
      if (!email || !role || !['student', 'instructor', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid email or role" });
      }

      // Find user by email and update role
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?email=eq.${email}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const updated = await response.json();
      
      if (updated.length === 0) {
        return res.status(404).json({ error: "User not found with that email" });
      }

      res.json({ success: true, profile: updated[0] });
    } catch (error) {
      console.error("Error setting user role:", error);
      res.status(500).json({ error: "Failed to set user role" });
    }
  });

  // Grant points to user (admin only) - NEW ENDPOINT  
  app.post("/api/admin/users/grant-points", requireAdmin, async (req, res) => {
    try {
      const { email, points } = req.body;
      
      if (!email || typeof points !== 'number' || points <= 0) {
        return res.status(400).json({ error: "Invalid email or points amount" });
      }

      // Get current profile by email
      const getResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?email=eq.${email}`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!getResponse.ok) {
        throw new Error(`Failed to fetch profile: HTTP ${getResponse.status}`);
      }

      const profiles = await getResponse.json();
      const currentProfile = profiles[0];
      
      if (!currentProfile) {
        return res.status(404).json({ error: "User not found with that email" });
      }

      // Grant points (add to existing)
      const newPoints = (currentProfile.fhir_points || 0) + points;
      
      const updateResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?email=eq.${email}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ fhir_points: newPoints })
      });

      if (!updateResponse.ok) {
        throw new Error(`HTTP ${updateResponse.status}`);
      }

      const updated = await updateResponse.json();
      res.json({ 
        success: true, 
        profile: updated[0], 
        pointsGranted: points,
        newTotal: newPoints
      });
    } catch (error) {
      console.error("Error granting points:", error);
      res.status(500).json({ error: "Failed to grant points" });
    }
  });

  // Deduct points from user (admin only) - NEW ENDPOINT
  app.post("/api/admin/users/deduct-points", requireAdmin, async (req, res) => {
    try {
      const { email, points } = req.body;
      
      if (!email || typeof points !== 'number' || points <= 0) {
        return res.status(400).json({ error: "Invalid email or points amount" });
      }

      // Get current profile by email
      const getResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?email=eq.${email}`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!getResponse.ok) {
        throw new Error(`Failed to fetch profile: HTTP ${getResponse.status}`);
      }

      const profiles = await getResponse.json();
      const currentProfile = profiles[0];
      
      if (!currentProfile) {
        return res.status(404).json({ error: "User not found with that email" });
      }

      // Deduct points (ensure not below 0)
      const newPoints = Math.max(0, (currentProfile.fhir_points || 0) - points);
      
      const updateResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?email=eq.${email}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ fhir_points: newPoints })
      });

      if (!updateResponse.ok) {
        throw new Error(`HTTP ${updateResponse.status}`);
      }

      const updated = await updateResponse.json();
      res.json({ 
        success: true, 
        profile: updated[0], 
        pointsDeducted: points,
        newTotal: newPoints
      });
    } catch (error) {
      console.error("Error deducting points:", error);
      res.status(500).json({ error: "Failed to deduct points" });
    }
  });
  
  // Update user role (admin only)
  app.post("/api/admin/users/role", requireAdmin, async (req, res) => {
    try {
      const { userId, role } = req.body;
      
      if (!userId || !role || !['student', 'instructor', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid userId or role" });
      }

      // Update profile role in Supabase
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const updated = await response.json();
      res.json({ success: true, profile: updated[0] });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Add/remove user points (admin only)
  app.post("/api/admin/users/points", requireAdmin, async (req, res) => {
    try {
      const { userId, points } = req.body;
      
      if (!userId || typeof points !== 'number') {
        return res.status(400).json({ error: "Invalid userId or points" });
      }

      // Get current profile
      const getResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!getResponse.ok) {
        throw new Error(`Failed to fetch profile: HTTP ${getResponse.status}`);
      }

      const profiles = await getResponse.json();
      const currentProfile = profiles[0];
      
      if (!currentProfile) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update points
      const newPoints = Math.max(0, (currentProfile.fhir_points || 0) + points);
      
      const updateResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ fhir_points: newPoints })
      });

      if (!updateResponse.ok) {
        throw new Error(`HTTP ${updateResponse.status}`);
      }

      const updated = await updateResponse.json();
      res.json({ success: true, profile: updated[0] });
    } catch (error) {
      console.error("Error updating user points:", error);
      res.status(500).json({ error: "Failed to update user points" });
    }
  });

  // Send password reset email (admin only)
  app.post("/api/admin/users/reset-password", requireAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Use Supabase Auth API to trigger password reset
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      res.json({ success: true, message: "Password reset email sent" });
    } catch (error) {
      console.error("Error sending password reset:", error);
      res.status(500).json({ error: "Failed to send password reset email" });
    }
  });

  // ===== ADMIN PRODUCT MANAGEMENT =====
  
  // Get all products (admin only)
  app.get("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const products = await response.json();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Create product (admin only)
  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const { sku, name, description, price_cents, stripe_price_id, is_active } = req.body;
      
      if (!sku || !name || typeof price_cents !== 'number') {
        return res.status(400).json({ error: "Missing required fields: sku, name, price_cents" });
      }

      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/products`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          sku,
          name,
          description,
          price_cents,
          stripe_price_id,
          is_active: is_active !== false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const product = await response.json();
      res.json(product[0]);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Update product (admin only)
  app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const updated = await response.json();
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Delete product (admin only)
  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // ===== ADMIN COURSE MANAGEMENT =====
  
  // Get all courses (admin only)
  app.get("/api/admin/courses", requireAdmin, async (req, res) => {
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/courses?select=*&order=sort_order.asc`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const courses = await response.json();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  // Create course (admin only)
  app.post("/api/admin/courses", requireAdmin, async (req, res) => {
    try {
      const { title, description, is_free, requires_product_sku, is_active, sort_order } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "Course title is required" });
      }

      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/courses`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          title,
          description,
          is_free: is_free !== false,
          requires_product_sku,
          is_active: is_active !== false,
          sort_order: sort_order || 0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const course = await response.json();
      res.json(course[0]);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  // Update course (admin only)
  app.put("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/courses?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const updated = await response.json();
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  // Delete course (admin only)
  app.delete("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/courses?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  // ===== ADMIN BADGE MANAGEMENT =====
  
  // Get all badges (admin only)
  app.get("/api/admin/badges", requireAdmin, async (req, res) => {
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/badge_types?select=*&order=created_at.desc`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const badges = await response.json();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Create badge (admin only)
  app.post("/api/admin/badges", requireAdmin, async (req, res) => {
    try {
      const { name, description, icon_name, icon_color, points_reward, is_active } = req.body;
      
      if (!name || !icon_name || !icon_color || typeof points_reward !== 'number') {
        return res.status(400).json({ error: "Missing required fields: name, icon_name, icon_color, points_reward" });
      }

      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/badge_types`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name,
          description,
          icon_name,
          icon_color,
          points_reward,
          is_active: is_active !== false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const badge = await response.json();
      res.json(badge[0]);
    } catch (error) {
      console.error("Error creating badge:", error);
      res.status(500).json({ error: "Failed to create badge" });
    }
  });

  // Update badge (admin only)
  app.put("/api/admin/badges/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/badge_types?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const updated = await response.json();
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating badge:", error);
      res.status(500).json({ error: "Failed to update badge" });
    }
  });

  // Delete badge (admin only)
  app.delete("/api/admin/badges/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/badge_types?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting badge:", error);
      res.status(500).json({ error: "Failed to delete badge" });
    }
  });

  // ===== ADMIN BILLING/PURCHASES =====
  
  // Get billing stats (admin only)
  app.get("/api/admin/billing/stats", requireAdmin, async (req, res) => {
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/purchases?select=*`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const purchases = await response.json();
      
      // Calculate stats
      const totalRevenue = purchases
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + p.amount_cents, 0);
      
      const totalPurchases = purchases.filter((p: any) => p.status === 'completed').length;
      const pendingPayments = purchases.filter((p: any) => p.status === 'pending').length;
      
      // Monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = purchases
        .filter((p: any) => {
          if (p.status !== 'completed') return false;
          const purchaseDate = new Date(p.purchased_at);
          return purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, p: any) => sum + p.amount_cents, 0);

      res.json({
        total_revenue: totalRevenue,
        total_purchases: totalPurchases,
        pending_payments: pendingPayments,
        monthly_revenue: monthlyRevenue
      });
    } catch (error) {
      console.error("Error fetching billing stats:", error);
      res.status(500).json({ error: "Failed to fetch billing stats" });
    }
  });

  // Get all purchases (admin only)
  app.get("/api/admin/billing/purchases", requireAdmin, async (req, res) => {
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/purchases?select=*,profiles(email,full_name),products(name)&order=purchased_at.desc`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const purchases = await response.json();
      
      // Transform to flatten the joined data
      const transformedPurchases = purchases.map((purchase: any) => ({
        ...purchase,
        user_email: purchase.profiles?.email || null,
        user_name: purchase.profiles?.full_name || null,
        product_name: purchase.products?.name || purchase.product_sku
      }));

      res.json(transformedPurchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ error: "Failed to fetch purchases" });
    }
  });

  // ===== INSTRUCTOR CONTENT MANAGEMENT =====
  
  // Get all lab content for visibility management (instructor/admin)
  app.get("/api/instructor/content", requireInstructorOrAdmin, async (req, res) => {
    try {
      // Mock data for now - in real implementation, this would come from a database
      // that tracks lab content visibility and requirements
      const labContent = [
        // Day 1 Labs
        { id: '1-1', title: 'FHIR Server Setup & Testing', description: 'Connect to public FHIR servers and test connectivity', day: 1, step: 1, is_visible: true, requires_authentication: false, estimated_minutes: 15, content_type: 'lab' },
        { id: '1-2', title: 'Patient Data Exploration', description: 'Browse and search patient resources using FHIR queries', day: 1, step: 2, is_visible: true, requires_authentication: false, estimated_minutes: 20, content_type: 'lab' },
        { id: '1-3', title: 'Bundle Upload & Ingestion', description: 'Upload synthetic patient bundles to FHIR server', day: 1, step: 3, is_visible: true, requires_authentication: false, estimated_minutes: 25, content_type: 'lab' },
        { id: '1-quiz', title: 'Day 1 Knowledge Check', description: 'Test understanding of FHIR basics and data ingestion', day: 1, step: 4, is_visible: false, requires_authentication: false, estimated_minutes: 10, content_type: 'quiz' },
        
        // Day 2 Labs  
        { id: '2-1', title: 'Data Export & Transformation', description: 'Export FHIR data to CSV format for analysis', day: 2, step: 1, is_visible: false, requires_authentication: false, estimated_minutes: 30, content_type: 'lab' },
        { id: '2-2', title: 'Risk Score Calculation', description: 'Calculate patient risk scores using SQL transformations', day: 2, step: 2, is_visible: false, requires_authentication: true, estimated_minutes: 45, content_type: 'lab' },
        { id: '2-3', title: 'Analytics Dashboard', description: 'Create visualizations of patient data and risk scores', day: 2, step: 3, is_visible: false, requires_authentication: true, estimated_minutes: 35, content_type: 'lab' },
        { id: '2-quiz', title: 'Day 2 Assessment', description: 'Evaluate data transformation and analytics skills', day: 2, step: 4, is_visible: false, requires_authentication: false, estimated_minutes: 15, content_type: 'quiz' },
        
        // Day 3 Labs
        { id: '3-1', title: 'FHIR Observations Creation', description: 'Create and structure FHIR observation resources', day: 3, step: 1, is_visible: false, requires_authentication: true, estimated_minutes: 40, content_type: 'lab' },
        { id: '3-2', title: 'Risk Score Publishing', description: 'Publish calculated risk scores back to FHIR server', day: 3, step: 2, is_visible: false, requires_authentication: true, estimated_minutes: 30, content_type: 'lab' },
        { id: '3-byod', title: 'Bring Your Own Data (BYOD)', description: 'Apply the full pipeline to your own healthcare data', day: 3, step: 3, is_visible: false, requires_authentication: true, estimated_minutes: 60, content_type: 'byod' },
        { id: '3-quiz', title: 'Final Assessment', description: 'Comprehensive test of all FHIR interoperability skills', day: 3, step: 4, is_visible: false, requires_authentication: true, estimated_minutes: 20, content_type: 'quiz' }
      ];

      res.json(labContent);
    } catch (error) {
      console.error("Error fetching lab content:", error);
      res.status(500).json({ error: "Failed to fetch lab content" });
    }
  });

  // Update lab content visibility (instructor/admin)
  app.put("/api/instructor/content/:labId/visibility", requireInstructorOrAdmin, async (req, res) => {
    try {
      const { labId } = req.params;
      const { is_visible } = req.body;
      
      // In a real implementation, this would update the lab content visibility in the database
      // For now, we'll just return success
      console.log(`Updated lab ${labId} visibility to ${is_visible}`);
      
      res.json({ success: true, lab_id: labId, is_visible });
    } catch (error) {
      console.error("Error updating content visibility:", error);
      res.status(500).json({ error: "Failed to update content visibility" });
    }
  });

  // Bulk update day content visibility (instructor/admin)
  app.put("/api/instructor/content/bulk-visibility", requireInstructorOrAdmin, async (req, res) => {
    try {
      const { day, is_visible } = req.body;
      
      if (!day || typeof is_visible !== 'boolean') {
        return res.status(400).json({ error: "Invalid day or visibility value" });
      }
      
      // In a real implementation, this would update all labs for the specified day
      console.log(`Updated all Day ${day} content visibility to ${is_visible}`);
      
      res.json({ success: true, day, is_visible });
    } catch (error) {
      console.error("Error bulk updating visibility:", error);
      res.status(500).json({ error: "Failed to bulk update visibility" });
    }
  });
}