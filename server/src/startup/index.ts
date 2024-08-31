import database from '../config/database';
import CommandLineRunner from '../helpers/CommandLineRunner';
import { AGENDA_COLLECTION_NAME, AGENDA_SCHEDULE_NAME } from '../config/constants';
import CronJob from '../helpers/CronJob';
import { Agenda } from 'agenda';
import AppLogger from '../utils/AppLogger';
import { AppAgenda } from "agenda-schedule-wrapper";
import { BOOK_APPOINTMENT } from "../config/constants";
import moment from "moment";
import agendaManager from '../services/AgendaManager';

const logger = AppLogger.init('mongoDb').logger;

export default async function startup() {
  const mongodb = await database.mongodb();
  await CommandLineRunner.run();
  logger.info('MongoDB Connected Successfully');

  // const agenda = new Agenda({
  //   db: {
  //     address: database.mongoUrl,
  //     collection: AGENDA_COLLECTION_NAME,
  //   },
  //   // processEvery: '30 seconds'
  // });

  // await QueueManager.init({
  //   queueClient: queue.client,
  //   queue: QUEUE_EVENTS.name,
  // });

  AppAgenda.init({
    db: mongodb,
    collection: AGENDA_SCHEDULE_NAME,
  });

  // agendaManager();

  // agenda.define('cronJobs', { concurrency: 1 }, async (job: any) => {
  //   await CronJob.deleteFeedback()
  // });

  // await agenda.start();
  // await agenda.every('0 0 * * *', 'cronJobs');

}
