import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('NotificationGateway');
  
  // Map userId to socket IDs for targeted notifications
  private userSockets: Map<string, Set<string>> = new Map();

  afterInit(server: Server) {
    this.logger.log('🔌 WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    // Extract userId from query params or auth token
    const userId = client.handshake.query.userId as string;
    
    if (userId) {
      // Store socket for this user
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);
      
      this.logger.log(`Client connected: ${client.id} (userId: ${userId})`);
      this.logger.log(`Active users: ${this.userSockets.size}`);
    } else {
      this.logger.warn(`Client ${client.id} connected without userId`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(client.id);
      
      // Remove user entry if no more sockets
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
    
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Send notification to specific user
  sendNotificationToUser(userId: string, notification: any) {
    const socketIds = this.userSockets.get(userId);
    
    if (socketIds && socketIds.size > 0) {
      socketIds.forEach(socketId => {
        this.server.to(socketId).emit('notification', notification);
      });
      this.logger.log(`📨 Sent notification to user ${userId} (${socketIds.size} sockets)`);
      return true;
    }
    
    this.logger.log(`⚠️  User ${userId} not connected, notification not sent via WebSocket`);
    return false;
  }

  // Broadcast to all connected clients
  broadcastNotification(notification: any) {
    this.server.emit('notification', notification);
    this.logger.log(`📢 Broadcast notification to all clients`);
  }

  // Send unread count update to specific user
  sendUnreadCountUpdate(userId: string, count: number) {
    const socketIds = this.userSockets.get(userId);
    
    if (socketIds && socketIds.size > 0) {
      socketIds.forEach(socketId => {
        this.server.to(socketId).emit('unread-count', { count });
      });
      this.logger.log(`📊 Sent unread count (${count}) to user ${userId}`);
    }
  }
}
