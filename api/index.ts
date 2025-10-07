// Vercel Serverless Function Entry Point
// This file allows the Express server to run as a Vercel serverless function

import { createServer } from 'http';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import the Express app setup
let app: any;
let server: any;

async function getApp() {
  if (!app) {
    // Dynamic import to avoid issues with module resolution
    const { default: express } = await import('express');
    const { registerRoutes } = await import('../server/routes');

    app = express();
    server = await registerRoutes(app);
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();

    // Convert Vercel request to Express request
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
