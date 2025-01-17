import http from 'http';
import 'dotenv/config';
import app from './app';
import startup from './startup';
import AppLogger from './utils/AppLogger';
import SocketService from './services/SocketIoService';
import rabbitMqService from './config/RabbitMQConfig';
import initializeNotificationQueue, { birthdayNotifications, processBirthdayNotification } from './services/NotificationService';

const socketIoService = new SocketService();

const logger = AppLogger.init('server').logger;
const port = process.env.PORT || 5050;

const server = http.createServer(app);

async function scheduler() {
  const notificationQueue = await initializeNotificationQueue();

  if (!notificationQueue) {
    throw new Error('Failed to initialize queue.');
  }

  await birthdayNotifications()
  await processBirthdayNotification()
}

async function socketService() {
  try {
    socketIoService.setupSocketIO(server);
  } catch (error) {
    console.error('Error setting up Socket.IO:', error);
  }
}

async function startRabbitMqService() {
  try {
    await rabbitMqService.connectToRabbitMQ();
  } catch (error) {
    console.error('Error setting up RabbitMQ and Socket.IO:', error);
  }
}

async function startServer() {
  try {
    await startup();
    await socketService();
    await startRabbitMqService();
    await scheduler()
    server.listen(port, () => logger.info(`Server running on port: ${port}`));
  } catch (error) {
    console.error('Error starting the server:', error);
  }
}

startServer();