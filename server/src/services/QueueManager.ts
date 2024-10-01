import { Logger } from 'winston';
import AppLogger from '../utils/AppLogger';
import SendMailService from './SendMailService';

const sendMailService = new SendMailService();

export default class QueueManager {
  private static queueName: string;
  private static data: any;
  private static channel: any;  // Reuse the same channel
  private static LOG: Logger = AppLogger.init(QueueManager.name).logger;

  // Initialize the queue manager with queue name and channel
  public static async init({ queueClient, queue }: any) {
    this.queueName = queue;
    const client = await queueClient();
    this.channel = await client.createChannel();
    
    await this.channel.assertQueue(this.queueName, { durable: true });
  }

  // Dispatch a message to the queue
  public static async dispatch({ data }: any) {
    this.data = data;
    await this.produce();
  }

  // Produce or add messages to the queue
  private static async produce() {
    if (!this.channel) {
      this.LOG.error("Channel is not initialized.");
      return;
    }

    try {
      await this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(this.data)), {
        persistent: true,  // Make sure messages survive restarts
      });
      this.LOG.info(`Message added to queue: ${this.queueName}`);
    } catch (error) {
      this.LOG.error(`Failed to produce message: ${error}`);
    }
  }

  // Consume messages from the queue
  public static async consume() {
    if (!this.channel) {
      this.LOG.error("Channel is not initialized.");
      return;
    }

    try {
      await this.channel.consume(
        this.queueName,
        async (msg: any) => {
          if (msg !== null) {
            const data = JSON.parse(msg.content.toString());

            // Send email and handle errors
            try {
              await sendMailService.sendMail(data);
              this.LOG.info(`Email sent successfully}`);
              this.channel.ack(msg);  // Acknowledge that the message has been processed
            } catch (error) {
              this.LOG.error(`Failed to send email: ${error}`);
              this.channel.nack(msg);  // Requeue message if failed
            }
          }
        },
        { noAck: false }  // Enable manual acknowledgment to ensure reliability
      );
    } catch (error) {
      this.LOG.error(`Failed to consume messages: ${error}`);
    }
  }

  // Close the channel when necessary
  public static async closeChannel() {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
  }
}
