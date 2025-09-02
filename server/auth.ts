import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-client';
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

interface User {
  id: string;
  email?: string;
  user_metadata?: any;
  app_metadata?: any;
  role: string;
  aud: string;
  exp: number;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'student' | 'instructor' | 'admin';
  fhir_points: number;
  created_at: string;
}

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: User;
      profile?: Profile;
    }
  }
}

class SupabaseAuth {
  private supabaseUrl: string;
  private serviceKey: string;
  private jwksClient: jwksClient.JwksClient;

  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!this.supabaseUrl) {
      console.warn('Missing env var: VITE_SUPABASE_URL - Authentication will be disabled');
      return;
    }

    if (!this.serviceKey) {
      console.warn('Missing env var: SUPABASE_SERVICE_ROLE_KEY - Authentication will be disabled');
      return;
    }

    // Remove trailing slash
    this.supabaseUrl = this.supabaseUrl.replace(/\/$/, '');

    // Extract project ID from URL
    const projectId = this.supabaseUrl.split('//')[1]?.split('.')[0];
    
    if (!projectId) {
      throw new Error('Invalid Supabase URL format');
    }

    // Initialize JWKS client
    this.jwksClient = jwksClient({
      jwksUri: `https://${projectId}.supabase.co/rest/v1/auth/.well-known/jwks`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 3600000, // 1 hour
    });
  }

  async verifyToken(token: string): Promise<User> {
    if (!this.supabaseUrl || !this.serviceKey) {
      throw new Error('Authentication not configured');
    }

    return new Promise((resolve, reject) => {
      // First decode to get header
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded || !decoded.header.kid) {
        return reject(new Error('Invalid token format'));
      }

      // Get signing key
      this.jwksClient.getSigningKey(decoded.header.kid, (err: any, key: any) => {
        if (err) {
          return reject(err);
        }

        const signingKey = key?.getPublicKey();
        
        if (!signingKey) {
          return reject(new Error('Unable to get signing key'));
        }

        // Verify token
        jwt.verify(token, signingKey, {
          audience: 'authenticated',
          issuer: `${this.supabaseUrl}/auth/v1`,
          algorithms: ['RS256']
        }, (verifyErr, payload) => {
          if (verifyErr) {
            return reject(verifyErr);
          }

          if (typeof payload === 'string' || !payload) {
            return reject(new Error('Invalid payload'));
          }

          const user: User = {
            id: payload.sub as string,
            email: payload.email as string,
            user_metadata: payload.user_metadata || {},
            app_metadata: payload.app_metadata || {},
            role: payload.role as string || 'authenticated',
            aud: payload.aud as string,
            exp: payload.exp as number
          };

          resolve(user);
        });
      });
    });
  }

  async getUserProfile(userId: string): Promise<Profile | null> {
    if (!this.supabaseUrl || !this.serviceKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        headers: {
          'apikey': this.serviceKey,
          'Authorization': `Bearer ${this.serviceKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const profiles = await response.json();
      return profiles[0] || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async upsertUserProfile(userId: string, profileData: Partial<Profile>): Promise<Profile> {
    if (!this.supabaseUrl || !this.serviceKey) {
      throw new Error('Authentication not configured');
    }

    try {
      const data = {
        id: userId,
        ...profileData
      };

      const response = await fetch(`${this.supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'apikey': this.serviceKey,
          'Authorization': `Bearer ${this.serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation,resolution=merge-duplicates'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }
  }
}

// Global auth instance
export const authHandler = new SupabaseAuth();

// Middleware to extract and verify JWT token
export const extractUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const user = await authHandler.verifyToken(token);
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    // Don't fail on invalid token, just continue without user
    next();
  }
};

// Middleware requiring authenticated user
export const requireUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  next();
};

// Middleware requiring admin role
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const profile = await authHandler.getUserProfile(req.user.id);
    
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.profile = profile;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify user role' });
  }
};

// Middleware requiring instructor or admin role
export const requireInstructorOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const profile = await authHandler.getUserProfile(req.user.id);
    
    if (!profile || !['instructor', 'admin'].includes(profile.role)) {
      return res.status(403).json({ error: 'Instructor or admin access required' });
    }

    req.profile = profile;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify user role' });
  }
};

// CORS setup
export const setupCors = (app: any) => {
  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
  
  app.use(cors({
    origin: [appBaseUrl, 'http://localhost:5173', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['*']
  }));
};