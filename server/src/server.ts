import http from 'http';
import 'dotenv/config';
import app from './app';
import startup from './startup';
import AppLogger from './utils/AppLogger';
import SocketService from './services/SocketIoService';

const socketIoService = new SocketService();

const logger = AppLogger.init('server').logger;
const port = process.env.PORT || 5050;

const server = http.createServer(app);

async function socketService() {
  try {
    socketIoService.setupSocketIO(server);
  } catch (error) {
    console.error('Error setting up Socket.IO:', error);
  }
}

async function startServer() {
  try {
    await startup();
    await socketService();
    server.listen(port, () => logger.info(`Server running on port: ${port}`));
  } catch (error) {
    console.error('Error starting the server:', error);
  }
}

startServer();