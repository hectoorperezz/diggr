import express from 'express';
import http from 'http';

export async function registerRoutes(app: express.Application): Promise<http.Server> {
  // Create HTTP server
  const server = http.createServer(app);

  // Add your API routes here
  // Example:
  // app.get('/api/data', (req, res) => {
  //   res.json({ data: 'some data' });
  // });

  return server;
} 