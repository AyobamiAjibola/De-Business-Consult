import { Server, Socket } from 'socket.io';
import { corsOptions } from '../app';
import AppLogger from '../utils/AppLogger';
import datasources from './dao';
import { IChatMessageModel } from '../models/ChatMessages';

const logger = AppLogger.init('server').logger;

class SocketService {
  private io: Server<any, any, any, any> | null;
  private onlineUsers: any[];

  constructor() {
    this.io = null;
    this.onlineUsers = [];
  }

  // Send a message to a user using Socket.IO
  async sendMessageToUser(
    senderId: any,
    receiverId: any,
    message: string,
    chatId: string
  ) {
    const response = await datasources.chatMessageDAOService.create({
      chatId,
      senderId,
      receiverId,
      message,
    } as IChatMessageModel);

    this.io?.to(senderId).emit('messageSentAck', { chatId });

    const targetSocketRooms = this.io?.sockets.adapter.rooms.get(receiverId);
    if (targetSocketRooms) {
      this.io?.to(receiverId).emit('receivePrivateMessage', { chatId, senderId, message });
    } else {
      console.log('Receiver not online.');
    }
  }

  setupSocketIO(server: any): void {
    this.io = new Server(server, {
      cors: corsOptions,
    });

    this.io.on('connection', (socket: Socket<any, any, any, any>) => {
      console.log(`Client connected. ${socket.id}`);
      logger.info(socket.id);

      socket.on('userId', (userId: any) => {
        if (userId) {
          if (!this.onlineUsers.some(user => user.userId === userId)) {
            this.onlineUsers.push({
              userId,
              socketId: socket.id,
            });
          }
          socket.join(userId);
          console.log(`Socket joined room for userId: ${userId}`);
        } else {
          console.log('Invalid or disconnected socket.');
        }

        socket.emit('getOnlineUsers', this.onlineUsers);
      });

      socket.on('sendPrivateMessage', (data: any) => {
        const { senderId, receiverId, message, chatId } = data;
        this.sendMessageToUser(senderId, receiverId, message, chatId);
      });

      socket.on('userTypingMsg', (data: any) => {
        const targetSocketRoom = this.io?.sockets.adapter.rooms.get(data.receiver);
        if (targetSocketRoom) {
          this.io?.to(data.receiver).emit('userTypingMsgAck', data.message);
        }
      });

      socket.on('userNotTypingMsg', (data: any) => {
        const targetSocketRoom = this.io?.sockets.adapter.rooms.get(data.receiver);
        if (targetSocketRoom) {
          this.io?.to(data.receiver).emit('userNotTypingMsgAck', data.message);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client with id ${socket.id} disconnected.`);
        logger.info(`Client with id ${socket.id} disconnected`);

        this.onlineUsers = this.onlineUsers.filter(user => user.socketId !== socket.id);
        this.io?.emit('getOnlineUsers', this.onlineUsers);
      });
    });
  }
}

export default SocketService;
