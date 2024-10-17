import Bull from 'bull';
import redisClient from '../config/redisConfig';
import LOG from '../config/AppLoggerConfig';
import appointment_schedule_template from '../resources/template/email/appointment_schedule';
import moment from 'moment-timezone';
import rabbitMqService from '../config/RabbitMQConfig';

let notificationQueue: Bull.Queue | null = null;
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface IProps {
    appointmentTime: Date, 
    email: string | null,
    appointmentId: string
}

// Initialize the notification queue
const initializeNotificationQueue = async (): Promise<Bull.Queue | null> => {
    if (!notificationQueue) {
        try {
            const redis = await redisClient();
            notificationQueue = new Bull('appointmentNotifications', {
                redis: {
                    host: redis.options.host,
                    port: redis.options.port,
                },
            });

            notificationQueue.on('error', (error: any) => {
                LOG.error('Bull queue error:', error);
            });

            LOG.info('Notification queue initialized successfully.');
        } catch (error) {
            LOG.error('Failed to initialize notification queue:', error);
        }
    }
    return notificationQueue;
};

// Schedule notifications for appointments
export const scheduleNotifications = async ({
    appointmentTime, 
    email,
    appointmentId
}: IProps) => {

    const appointmentTimeWithoutZ = appointmentTime.toISOString().replace('Z', '');
    const actualAppointmentTime = moment(appointmentTimeWithoutZ).tz(timeZone)
    const notificationTimes = [
        { time: actualAppointmentTime.clone().subtract(1, 'day') }, // 1 day before
        { time: actualAppointmentTime.clone().subtract(20, 'minutes') } // 20 minutes before
    ];

    for (const { time } of notificationTimes) {
        const now = moment.tz(timeZone);
        const delay = time.diff(now);

        if (now.isBefore(time)) {
            if (notificationQueue) {
                try {
                    await notificationQueue.add(
                        {
                            appointmentId,
                            email,
                            appointmentTime,
                        },
                        {
                            delay,
                            attempts: 5,
                            backoff: {
                                type: 'exponential',
                                delay: 5000, // Start with a 5 second backoff
                            }
                        }
                    );
                    LOG.info(`Scheduled notification for appointment ${appointmentId} at ${time.format()}`);
                } catch (error) {
                    LOG.error(`Failed to add job for appointment ${appointmentId}:`, error);
                }
            }
        }
    }
};

const getDaysAgo = (date: Date) => {
    const today = moment.tz(timeZone);
    const diff = today.diff(moment(date).tz(timeZone), 'day'); // Difference in days
    return diff;
};

// Process notifications from the queue
export const processNotifications = () => {
    if (notificationQueue) {
        notificationQueue.process(5, async (job) => {
            const { appointmentId, email, appointmentTime } = job.data;
    
            try {
                const date = moment.utc(appointmentTime)
                const mail = appointment_schedule_template({
                    date: getDaysAgo(appointmentTime),
                    time: date.format('h:mm a'),
                    appointmentId
                });
        
                const emailPayload = {
                    to: email,
                    replyTo: process.env.SMTP_EMAIL_FROM,
                    from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
                    subject: `De Business Consult.`,
                    html: mail
                }
                await rabbitMqService.sendEmail({data: emailPayload});
                //await sendMailService.sendMail(emailPayload);
                LOG.info(`Notification sent for appointment: ${appointmentId}`);
            } catch (error) {
                LOG.error(`Failed to send notification for appointment ${appointmentId}:`, error);
                // Optionally, you can retry or handle failed jobs here
            }
        });

        notificationQueue.on('completed', async (job) => {
            LOG.info(`Job ${job.id} completed successfully`);
            try {
                // Remove the job from the queue
                await job.remove();
                LOG.info(`Job ${job.id} removed from the queue successfully.`);
            } catch (error) {
                LOG.error(`Failed to remove job ${job.id}:`, error);
            }
        });

        notificationQueue.on('failed', (job, err) => {
            LOG.error(`Job ${job.id} failed with error: ${err.message}`);
        });
    }
};

export default initializeNotificationQueue;
