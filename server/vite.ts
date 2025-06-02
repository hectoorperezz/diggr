import express from 'express';
import path from 'path';

// Simple logger function
export function log(message: string): void {
  console.log(`[Server] ${message}`);
}

// Setup vite dev server (stub for now)
export async function setupVite(app: express.Application, server: any): Promise<void> {
  log('Vite development server setup');
  // Implementation would go here in a real setup
}

// Serve static files in production
export function serveStatic(app: express.Application): void {
  // Serve static files from the 'public' directory
  app.use(express.static(path.join(process.cwd(), 'public')));
  
  // Serve the client-side app
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });
} 