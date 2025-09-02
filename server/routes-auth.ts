import type { Express } from "express";
import { authHandler, requireUser, requireAdmin } from "./auth";

export function registerAuthRoutes(app: Express) {
  // Get current user profile and role
  app.get("/api/auth/me", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get profile from database
      let profile = await authHandler.getUserProfile(req.user.id);

      if (!profile) {
        // Create default profile if doesn't exist
        const profileData = {
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || null,
          avatar_url: req.user.user_metadata?.avatar_url || null,
          role: 'student' as const,
          fhir_points: 0
        };

        profile = await authHandler.upsertUserProfile(req.user.id, profileData);
      }

      res.json({
        user: {
          id: req.user.id,
          email: req.user.email,
          user_metadata: req.user.user_metadata || {},
        },
        profile: profile
      });
    } catch (error) {
      console.error("Error in /api/auth/me:", error);
      res.status(500).json({ error: "Failed to get user data" });
    }
  });

  // Create/update user profile (for frontend AuthGate)
  app.post("/api/auth/profile", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { role = 'student' } = req.body;

      const profileData = {
        email: req.user.email,
        full_name: req.user.user_metadata?.full_name || null,
        avatar_url: req.user.user_metadata?.avatar_url || null,
        role: role as 'student' | 'instructor' | 'admin',
        fhir_points: 0
      };

      const profile = await authHandler.upsertUserProfile(req.user.id, profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // Get user profile (for frontend AuthGate)
  app.get("/api/auth/profile", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const profile = await authHandler.getUserProfile(req.user.id);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Update user profile (name and avatar)
  app.post("/api/auth/profiles/upsert", requireUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { full_name, avatar_url } = req.body;

      // Get current profile
      const currentProfile = await authHandler.getUserProfile(req.user.id);

      // Prepare update data - preserve existing values and role
      const profileData: any = {
        email: req.user.email,
        role: currentProfile?.role || 'student',
        fhir_points: currentProfile?.fhir_points || 0
      };

      // Update provided fields
      if (full_name !== undefined) {
        profileData.full_name = full_name;
      } else if (currentProfile) {
        profileData.full_name = currentProfile.full_name;
      }

      if (avatar_url !== undefined) {
        profileData.avatar_url = avatar_url;
      } else if (currentProfile) {
        profileData.avatar_url = currentProfile.avatar_url;
      }

      const updatedProfile = await authHandler.upsertUserProfile(req.user.id, profileData);
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // List all profiles (admin only)
  app.get("/api/auth/profiles", requireAdmin, async (req, res) => {
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const profiles = await response.json();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  // Grant admin role (admin only)
  app.post("/api/auth/admin/grant", requireAdmin, async (req, res) => {
    try {
      const { user_email } = req.body;

      if (!user_email) {
        return res.status(400).json({ error: "user_email is required" });
      }

      // Use the grant_admin function
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/grant_admin`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_email })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      res.json({ 
        success: true, 
        message: `Admin role granted to ${user_email}` 
      });
    } catch (error) {
      console.error("Error granting admin role:", error);
      res.status(500).json({ error: "Failed to grant admin role" });
    }
  });
}