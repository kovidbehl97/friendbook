// friendbook/server/src/server.ts
import dotenv from 'dotenv';
import http from 'http';
import jwt from 'jsonwebtoken';
import express from 'express';
import { WebSocketServer } from 'ws';
import url from 'url';
import app from './app';
import { initializeWebSocket } from './socketEvents'; // Import WebSocket utility

dotenv.config();

const httpServer = http.createServer(app);

// Create a WebSocket server instance
const wss = new WebSocketServer({ server: httpServer });

// Initialize WebSocket utility with the server
initializeWebSocket(wss);

// Handle WebSocket authentication
const authenticateWebSocket = (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

wss.on('connection', (ws, req) => {
  // Parse the token from the request URL
  const token = url.parse(req.url as string, true).query.token as string;
  const userId = authenticateWebSocket(token);

  if (!userId) {
    console.log('WebSocket connection failed: Invalid token');
    ws.close(1008, 'Invalid token');
    return;
  }

  console.log(`User connected with native WebSocket: ${userId}`);

  // Store the user ID on the socket
  (ws as any).userId = userId;

  ws.on('message', (message) => {
    console.log(`Received message from ${userId}: ${message}`);
    // Add message handling logic if needed
  });

  ws.on('close', () => {
    console.log(`User disconnected from native WebSocket: ${userId}`);
  });
});

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});