import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { pubClient, subClient } from './redis';

export let io: SocketIOServer;

export function initializeSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET as string) as any;
      socket.data.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.userId}`);
    
    // Join a room specific to this user ID to receive direct notifications
    socket.join(`user:${socket.data.userId}`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId}`);
    });
  });

  // Listen to Redis PubSub for global event broadcasting to sockets
  try {
    subClient.subscribe('notifications', (err) => {
      if (err) console.warn('Redis subscribe failed (real-time via Redis disabled):', err.message);
      else console.log('✅ Subscribed to Redis notifications channel');
    });

    subClient.on('message', (channel, message) => {
      if (channel === 'notifications') {
        try {
          const data = JSON.parse(message);
          if (data.userId) {
            io.to(`user:${data.userId}`).emit('notification', data);
          } else {
            io.emit('notification', data);
          }
        } catch (err) {
          console.error('Error parsing notification message', err);
        }
      }
    });
  } catch (err: any) {
    console.warn('⚠️  Redis pub/sub not available, falling back to direct socket emit:', err.message);
  }
}

/**
 * Utility to publish a notification to a specific user via Redis PubSub.
 * Falls back to direct socket emit if Redis is unavailable.
 */
export async function sendNotification(userId: string, title: string, message: string, data?: any) {
  const payload = {
    userId,
    title,
    message,
    ...data,
    timestamp: new Date().toISOString()
  };

  try {
    await pubClient.publish('notifications', JSON.stringify(payload));
  } catch {
    // Fallback: direct emit via Socket.IO (single-instance mode)
    if (io) {
      io.to(`user:${userId}`).emit('notification', payload);
    }
  }
}
