import database from '../config/database';
import CommandLineRunner from '../helpers/CommandLineRunner';
import { AGENDA_COLLECTION_NAME } from '../config/constants';
import CronJob from '../helpers/CronJob';
import { Agenda } from 'agenda';
import AppLogger from '../utils/AppLogger';

const logger = AppLogger.init('mongoDb').logger;

export default async function startup() {
  await database.mongodb();
  await CommandLineRunner.run();
  logger.info('MongoDB Connected Successfully');

  const agenda = new Agenda({
    db: {
      address: database.mongoUrl,
      collection: AGENDA_COLLECTION_NAME,
    },
    // processEvery: '30 seconds'
  });

  agenda.define('cronJobs', { concurrency: 1 }, async (job: any) => {
    await CronJob.deleteFeedback()
  });

  await agenda.start();
  await agenda.every('0 0 * * *', 'cronJobs');

}
