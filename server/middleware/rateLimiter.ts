/**
 * Simple in-memory rate limiter for sensitive endpoints
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// In-memory storage for rate limit data
const rateLimitStore = new Map<string, RateLimitInfo>();

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key generator
}

const defaultKeyGenerator = (req: Request): string => {
  // Use session ID if available, otherwise fall back to IP
  const sessionId = req.sessionID || req.session?.id;
  if (sessionId) {
    return `session:${sessionId}`;
  }
  
  // Get IP address from various headers
  const ip = req.ip || 
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    'unknown';
  
  return `ip:${Array.isArray(ip) ? ip[0] : ip}`;
};

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = `Too many requests, please try again in ${Math.ceil(windowMs / 1000)} seconds.`,
    keyGenerator = defaultKeyGenerator
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to trigger cleanup
      for (const [k, info] of rateLimitStore.entries()) {
        if (now > info.resetTime) {
          rateLimitStore.delete(k);
        }
      }
    }
    
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // First request or window expired, reset
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - 1).toString(),
        'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
      });
      
      return next();
    }
    
    if (current.count < maxRequests) {
      // Under limit, increment and continue
      current.count++;
      rateLimitStore.set(key, current);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - current.count).toString(),
        'X-RateLimit-Reset': new Date(current.resetTime).toISOString()
      });
      
      return next();
    }
    
    // Rate limit exceeded
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
      'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
    });
    
    res.status(429).json({
      error: 'Rate limit exceeded',
      message,
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    });
  };
}

// Pre-configured rate limiters for different use cases
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts. Please try again in 15 minutes.'
});

export const checkoutRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3, // 3 checkout attempts per 5 minutes
  message: 'Too many checkout attempts. Please wait 5 minutes before trying again.'
});

export const pointsRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 points operations per minute
  message: 'Too many points operations. Please wait 1 minute before trying again.'
});

export const redemptionRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 5, // 5 redemptions per 10 minutes
  message: 'Too many redemption attempts. Please wait 10 minutes before trying again.'
});

export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 API calls per minute
  message: 'API rate limit exceeded. Please slow down your requests.'
});

// Clear rate limit data (for testing or administrative purposes)
export function clearRateLimitData(key?: string) {
  if (key) {
    rateLimitStore.delete(key);
  } else {
    rateLimitStore.clear();
  }
}

// Get current rate limit stats (for monitoring)
export function getRateLimitStats() {
  const now = Date.now();
  const stats = {
    totalKeys: rateLimitStore.size,
    activeKeys: 0,
    expiredKeys: 0
  };
  
  for (const [, info] of rateLimitStore.entries()) {
    if (now > info.resetTime) {
      stats.expiredKeys++;
    } else {
      stats.activeKeys++;
    }
  }
  
  return stats;
}