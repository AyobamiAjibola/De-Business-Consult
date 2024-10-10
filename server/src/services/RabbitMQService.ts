import { Connection, Channel } from 'amqplib';
import Stripe from 'stripe';
import { processEvent } from './PaymentEventWorkerService';
import queue from '../config/queue';
import { Logger } from 'winston';
import SendMailService from './SendMailService';
import LOG from '../config/AppLoggerConfig';

const sendMailService = new SendMailService();

class RabbitMQService {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private readonly queueName: string;
    private readonly emailQueue: string;
    private data: any | null = null;
    private readonly LOG: Logger = LOG

    constructor(queueName: string, emailQueue: string) {
        this.queueName = queueName;
        this.emailQueue = emailQueue;
    }

    // Check if channel is initialized
    private ensureChannelInitialized(): void {
        if (!this.channel) {
            this.LOG.error('RabbitMQ channel is not initialized');
            throw new Error('RabbitMQ channel is not initialized');
        }
    }

    async connectToRabbitMQ(): Promise<void> {
        try {
            this.connection = await queue.client();
            this.channel = await this.connection.createChannel();

            await Promise.all([
                this.channel.assertQueue(this.queueName, { durable: true }),
                this.channel.assertQueue(this.emailQueue, { durable: true }),
            ]);

            this.LOG.info(`Connected to queues: ${this.queueName}, ${this.emailQueue}`);

            await this.startWorker();
            await this.consumeEmails();
        } catch (error) {
            this.LOG.error('Error connecting to RabbitMQ:', error);
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
            this.LOG.info(`Disconnected from RabbitMQ queue: ${this.queueName}`);
        } catch (error) {
            this.LOG.error('Error disconnecting from RabbitMQ:', error);
        }
    }

    private async startWorker(): Promise<void> {
        this.ensureChannelInitialized()

        this.channel?.consume(this.queueName, async (msg) => {
            if (!msg) return;

            const event: Stripe.Event = JSON.parse(msg.content.toString());

            try {
                await processEvent(event);
                this.channel?.ack(msg); // Acknowledge after successful processing
            } catch (error) {
                this.LOG.error('Error processing event:', error);
                this.channel?.nack(msg); // Reject on failure
            }
        });
    }

    async publishMessage(message: any): Promise<void> {
        this.ensureChannelInitialized()

        try {
            const messageBuffer = Buffer.from(JSON.stringify(message));
            await this.channel?.sendToQueue(this.queueName, messageBuffer, { persistent: true });
            this.LOG.info(`Message sent to queue ${this.queueName}:`, message);
        } catch (error) {
            this.LOG.error('Error publishing message to RabbitMQ:', error);
        }
    }

    public async sendEmail({ data }: { data: any }): Promise<void> {
        this.data = data;
        await this.produce();
    }

    private async produce(): Promise<void> {
        this.ensureChannelInitialized()

        try {
            const messageBuffer = Buffer.from(JSON.stringify(this.data));
            await this.channel?.sendToQueue(this.emailQueue, messageBuffer, { persistent: true });
            this.LOG.info(`Message added to queue: ${this.emailQueue}`);
        } catch (error) {
            this.LOG.error('Failed to produce message:', error);
        }
    }

    private async consumeEmails(): Promise<void> {
        this.ensureChannelInitialized()

        try {
            await this.channel?.consume(
                this.emailQueue,
                async (msg) => {
                    if (!msg) return;

                    const data = JSON.parse(msg.content.toString());

                    try {
                        await sendMailService.sendMail(data);
                        this.LOG.info(`Email sent successfully`);
                        this.channel?.ack(msg);
                    } catch (error) {
                        this.LOG.error('Failed to send email:', error);
                        this.channel?.nack(msg); // Requeue the message on failure
                    }
                },
                { noAck: false } // Enable manual acknowledgment
            );
        } catch (error) {
            this.LOG.error('Failed to consume messages:', error);
        }
    }
}

export default RabbitMQService;