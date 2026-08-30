import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSignaling } from './signaling.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 15000,
  maxHttpBufferSize: 1e8 // 100 MB for images & attachments
});

// REST Health and info endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PulseCord Signaling & Realtime Server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Initialize Socket.io signaling & music bot
setupSignaling(io);

const PORT = process.env.PORT || 4000;

export function startServer(port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`🚀 PulseCord Signaling Server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

// If run directly via `node server/index.js`
if (process.argv[1]?.endsWith('server/index.js') || process.argv[1]?.endsWith('server\\index.js')) {
  startServer(PORT);
}

export { app, server, io };
