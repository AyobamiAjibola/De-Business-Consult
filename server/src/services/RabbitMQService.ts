import amqp, { Connection, Channel, Message } from 'amqplib';
import settings from '../config/settings';
import AppLogger from '../utils/AppLogger';
import Stripe from 'stripe';
import { processEvent } from './PaymentEventWorkerService';

const logger = AppLogger.init('server').logger;
// @ts-ignore
const config = settings.queue[settings.service.env];

class RabbitMQService {
    private connection: Connection | null;
    private channel: Channel | null;
    private queueName: string;

    constructor(queueName: string) {
        this.connection = null;
        this.channel = null;
        this.queueName = queueName;
    }

    async connectToRabbitMQ(): Promise<void> {
        try {
            this.connection = await amqp.connect(config);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(this.queueName, { durable: true });
            logger.info(`RabbitMQService connected to queue: ${this.queueName}`);
            await this.startWorker()
        } catch (error) {
            logger.error('Error connecting to RabbitMQ:', error);
            throw error;
        }
    }

    async disconnectFromRabbitMQ(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            logger.info(`Disconnected from RabbitMQ queue: ${this.queueName}`);
        } catch (error) {
            logger.error('Error disconnecting from RabbitMQ:', error);
        }
    }

    public async startWorker() {
        if (!this.channel) {
            logger.error('RabbitMQ channel is not initialized for worker');
            return;
        }

        this.channel.consume(this.queueName, async (msg) => {
            if (msg !== null) {
                const event: Stripe.Event = JSON.parse(msg.content.toString());
    
                try {
                    await processEvent(event);
                    this.channel?.ack(msg);  // Acknowledge the message after processing
                } catch (error) {
                    logger.error('Error processing event:', error);
                    this.channel?.nack(msg);  // Reject the message if processing failed
                }
            }
        });
    }

    public async publishMessage(message: any): Promise<void> {
        if (!this.channel) {
            logger.error('RabbitMQ channel is not initialized');
            throw new Error('RabbitMQ channel is not initialized');
        }

        try {
            // Convert the message to a Buffer and send it to the queue
            const messageBuffer = Buffer.from(JSON.stringify(message));
            await this.channel.sendToQueue(this.queueName, messageBuffer, { persistent: true });
            logger.info(`Message sent to queue ${this.queueName}:`, message);
        } catch (error) {
            logger.error('Error publishing message to RabbitMQ:', error);
        }
    }

    

}

export default RabbitMQService;
