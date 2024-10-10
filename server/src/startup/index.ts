import database from '../config/database';
import CommandLineRunner from '../helpers/CommandLineRunner';
import AppLogger from '../utils/AppLogger';
// import initializeNotificationQueue, { processNotifications, scheduleNotifications } from '../services/BullSchedulerService';

const logger = AppLogger.init('mongoDb').logger;

export default async function startup() {
  await database.mongodb();
  await CommandLineRunner.run();
  logger.info('MongoDB Connected Successfully');

  // await initializeNotificationQueue();
  // await scheduleNotifications();  // You may want to call this periodically, not just on startup
  // processNotifications(); 

}
