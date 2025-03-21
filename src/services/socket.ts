import { io, Socket } from 'socket.io-client';
import { Shift, Notification } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private scheduleUpdateHandlers: ((data: any) => void)[] = [];
  private notificationUpdateHandlers: ((data: any) => void)[] = [];

  connect() {
    if (this.socket) {
      return;
    }

    this.socket = io('http://localhost:3000');
    
    // Setup listeners
    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    this.socket.on('scheduleUpdated', (data) => {
      this.scheduleUpdateHandlers.forEach(handler => handler(data));
    });

    this.socket.on('notificationUpdated', (data) => {
      this.notificationUpdateHandlers.forEach(handler => handler(data));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onScheduleUpdate(handler: (data: any) => void) {
    this.scheduleUpdateHandlers.push(handler);
    return () => {
      this.scheduleUpdateHandlers = this.scheduleUpdateHandlers.filter(h => h !== handler);
    };
  }

  onNotificationUpdate(handler: (data: any) => void) {
    this.notificationUpdateHandlers.push(handler);
    return () => {
      this.notificationUpdateHandlers = this.notificationUpdateHandlers.filter(h => h !== handler);
    };
  }

  emitScheduleUpdate(data: { shift: Shift, action: 'create' | 'update' | 'delete' | 'drop' | 'swap' | 'adjust' }) {
    if (this.socket) {
      this.socket.emit('scheduleUpdate', data);
    }
  }

  emitNotificationUpdate(data: { notification: Notification, action: 'create' | 'update' | 'approve' }) {
    if (this.socket) {
      this.socket.emit('notificationUpdate', data);
    }
  }
}

// Create and export a singleton instance
export const socketService = new SocketService();