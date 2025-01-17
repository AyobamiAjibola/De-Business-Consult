import Bull from 'bull';
import redisClient from '../config/redisConfig';
import LOG from '../config/AppLoggerConfig';
import moment from 'moment-timezone';
import rabbitMqService from '../config/RabbitMQConfig';
import datasources from './dao'
import birthday_template from '../resources/template/email/birthday';

let birthdayQueue: Bull.Queue | null = null;
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const initializeQueue = async (queueName: string): Promise<Bull.Queue<any> | null> => {
    try {
        const redis = await redisClient();
        if (!redis) {
            LOG.error('Redis client initialization failed.');
            throw new Error('Redis client initialization failed.');
        }

        const queue = new Bull(queueName, {
            redis: {
                host: redis.options.host,
                port: redis.options.port,
            },
        });

        queue.on('error', (error: any) => {
            LOG.error(`Queue (${queueName}) encountered an error:`, error);
        });

        LOG.info(`${queueName} queue initialized successfully.`);
        return queue;
    } catch (error) {
        LOG.error(`Failed to initialize ${queueName} queue:`, error);
        return null;
    }
};

export const initializeNotificationQueue = async (): Promise<Bull.Queue<any> | null> => {
    if (birthdayQueue) return birthdayQueue;
    birthdayQueue = await initializeQueue('daily-task-queue');
    return birthdayQueue;
};

export const birthdayNotifications = async (): Promise<void> => {
    if (!birthdayQueue) {
        LOG.error('Birthday queue is not initialized.');
        throw new Error('Birthday queue is not initialized.');
    }

    try {
        await birthdayQueue.add(
            {}, 
            { 
                repeat: { cron: '0 8 * * *' }, // Schedule for 8:00 AM daily
                attempts: 3 // Retry up to 3 times on failure
            }
        );
        LOG.info('Birthday notification job added successfully.');
    } catch (error) {
        LOG.error('Failed to add birthday notification job to the queue:', error);
        throw error;
    }
};

export const processBirthdayNotification = async (): Promise<void> => {
    if (birthdayQueue) {
        birthdayQueue.process(5, async (job) => {
            try {
                const today = moment().format('MM-DD');

                // Fetch all clients
                const clients = await datasources.clientDAOService.findAll({});
                if (!clients || clients.length === 0) {
                    LOG.info('No clients found.');
                    return;
                }

                // Process each client
                for (const client of clients) {
                    if (client.dob) {
                        const date = client.dob.toISOString().replace('Z', '')
                        const clientBirthday = moment(date).tz(timeZone).format('MM-DD');

                        if (clientBirthday === today) {
                            LOG.info(`Sending birthday notification to client: ${client.firstName || 'Unknown Name'}`);
                            
                            const mail = birthday_template({
                                name: client.firstName.charAt(0).toUpperCase() + client.firstName.slice(1)
                            });
                
                            const emailPayload = {
                                to: client.email,
                                replyTo: process.env.SMTP_EMAIL_FROM,
                                from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
                                subject: `De Business Consult.`,
                                html: mail,
                            };
                
                            await rabbitMqService.sendEmail({ data: emailPayload });
                            // if(client.phone) {
                            //     const payload = {
                            //         to: client.phone,
                            //         body: `Happy Birthday from all of us at De Business Consult! 🎉🎂 On this special day, we 
                            //         want to take a moment to celebrate YOU! 🎈 May your day be filled with joy, laughter, 
                            //         and all the wonderful things you deserve. Your presence brightens our community, 
                            //         and we're grateful to have you as part of our journey. Cheers to another fantastic 
                            //         year ahead! 🥳🎂 #CheersToYou 🎁🎊 `
                            //     }
                            //     await rabbitMqService.sendSMS({ data: payload })
                            // }
                        }
                    }
                }
            } catch (error) {
                LOG.error('Failed to process birthday notifications:', error);
                throw error;
            }
        });

        birthdayQueue.on('completed', async (job) => {
            LOG.info(`Job ${job.id} completed successfully.`);
            try {
                // Remove the job from the queue after successful processing
                await job.remove();
                LOG.info(`Job ${job.id} removed from the queue successfully.`);
            } catch (error) {
                LOG.error(`Failed to remove job ${job.id}:`, error);
            }
        });
    
        birthdayQueue.on('failed', (job, err) => {
            LOG.error(`Job ${job.id} failed with error: ${err.message}`);
        });
    } else {
        LOG.error('Notification queue is not initialized.');
        throw new Error('Notification queue is not initialized.');
    }
};

export default initializeNotificationQueue;
