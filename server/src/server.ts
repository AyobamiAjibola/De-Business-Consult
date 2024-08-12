import http from 'http';
import 'dotenv/config';
import app from './app';
import startup from './startup';
import AppLogger from './utils/AppLogger';

const logger = AppLogger.init('server').logger;
const port = process.env.PORT || 5050;

const server = http.createServer(app);

async function startRabbitMqService() {
  try {
    server.listen(port, () => logger.info(`Server running on port: ${port}`));
  } catch (error) {
    console.error('Error setting up RabbitMQ and Socket.IO:', error);
  }
}

async function startServer() {
  try {
    await startup();
    await startRabbitMqService();
  } catch (error) {
    console.error('Error starting the server:', error);
  }
}

startServer();