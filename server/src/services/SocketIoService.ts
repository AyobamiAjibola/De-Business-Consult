import { Server, Socket } from 'socket.io';
import { corsOptions } from '../app';
import AppLogger from '../utils/AppLogger';
import datasources from './dao';
import rabbitMqService from '../config/RabbitMQConfig';
import { QUEUE_EVENTS_CHAT, QUEUE_EVENTS_CHAT_SEEN, STATUSES } from '../config/constants';
import { randomUUID } from 'crypto';

const logger = AppLogger.init('server').logger;

interface SenderProps {
  senderId: string,
  fullName: string,
  image: string
}

interface ReceiverProps {
  receiverId: string,
  fullName: string,
  image: string
}

class SocketService {
  private io: Server<any, any, any, any> | null;
  private onlineUsers: any[];

  constructor() {
    this.io = null;
    this.onlineUsers = [];
  }

  // Send a message to a user using Socket.IO
  async sendMessageToUser(
    senderId: string,
    receiverId: string,
    message: string,
    chatId: string,
    fileUrl: string,
    fileName: string,
  ) {
    const messageId = randomUUID();
    const payload = {
      messageId,
      chatId,
      message,
      senderId,
      fileUrl,
      fileName
    };
  
    try {
      await rabbitMqService.publishMessageToQueue(QUEUE_EVENTS_CHAT.name, payload);
  
      const targetSocketRooms = this.io?.sockets.adapter.rooms.get(receiverId);
      if (targetSocketRooms) {
        this.io?.to(receiverId).emit('receivePrivateMessage', {
          chatId,
          senderId,
          message,
          fileUrl,
          fileName
        });

      } else {
        console.log('Receiver not online. Message will remain in queue.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle any errors (e.g., logging or retry mechanism).
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

      socket.on('sendPrivateMessage', async (data: any) => {
        const { senderId, receiverId, message, chatId, fileUrl, fileName } = data;
        await this.sendMessageToUser(
            senderId, receiverId, 
            message, chatId, 
            fileUrl, fileName );
      });

      socket.on('userTyping', (data: any) => {
        const { senderId, receiverId } = data;
      
        const targetSocketRoom = this.io?.sockets.adapter.rooms.get(receiverId);
        if (targetSocketRoom) {
          this.io?.to(receiverId).emit('userTypingAck', { senderId });
        }
      });

      socket.on('userStoppedTyping', (data: any) => {
        const { senderId, receiverId } = data;
        const targetSocketRoom = this.io?.sockets.adapter.rooms.get(receiverId);
        if (targetSocketRoom) {
          this.io?.to(receiverId).emit('userStoppedTypingAck', { senderId });
        }
      });

      socket.on('messageSeen', async (data: any) => {
        const { chatId, userId } = data;

        // Update the message status in the database
        await rabbitMqService.publishMessageToQueue(QUEUE_EVENTS_CHAT_SEEN.name, { chatId })
      
        // Emit acknowledgment to the sender if needed
        const senderSocketRooms = this.io?.sockets.adapter.rooms.get(data.senderId);
        if (senderSocketRooms) {
          this.io?.to(data.senderId).emit('messageReadAck', { chatId, userId });
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
