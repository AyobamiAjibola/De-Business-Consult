import { Connection, Channel, Message } from 'amqplib';
import Stripe from 'stripe';
import { processEvent } from './PaymentEventWorkerService';
import queue from '../config/queue';
import { Logger } from 'winston';
import SendMailService from './SendMailService';
import LOG from '../config/AppLoggerConfig';
import Joi from 'joi';

const sendMailService = new SendMailService();

class RabbitMQService {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private readonly paymentQueue: string;
    private readonly emailQueue: string;
    private readonly deadLetterQueue: string;
    private data: any | null = null;
    private readonly LOG: Logger = LOG;
    private retryLimit = 3;

    constructor(paymentQueue: string, emailQueue: string, deadLetterQueue: string) {
        this.paymentQueue = paymentQueue;
        this.emailQueue = emailQueue;
        this.deadLetterQueue = deadLetterQueue;
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

            // Asserting main queues and dead-letter queue
            await Promise.all([
                this.channel.assertQueue(this.paymentQueue, { durable: true }),
                this.channel.assertQueue(this.emailQueue, { durable: true }),
                this.channel.assertQueue(this.deadLetterQueue, { durable: true }),
            ]);

            // Prefetching to limit unacknowledged messages
            this.channel.prefetch(10); // Process max 10 messages at a time

            this.LOG.info(`Connected to queues: ${this.paymentQueue}, ${this.emailQueue}, ${this.deadLetterQueue}`);

            await this.startWorker();
            await this.consumeEmails();
        } catch (error) {
            this.LOG.error('Error connecting to RabbitMQ:', error);
            this.reconnect(); // Automatic reconnection in case of error
        }
    }

    // Automatic reconnection logic
    private async reconnect(): Promise<void> {
        this.LOG.info('Attempting to reconnect to RabbitMQ...');
        setTimeout(() => this.connectToRabbitMQ(), 5000); // Retry after 5 seconds
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
            this.LOG.info(`Disconnected from RabbitMQ queue: ${this.paymentQueue}`);
        } catch (error) {
            this.LOG.error('Error disconnecting from RabbitMQ:', error);
        }
    }

    // Graceful shutdown for application
    public async setupGracefulShutdown(): Promise<void> {
        process.on('SIGINT', async () => {
            this.LOG.info('Received SIGINT. Gracefully shutting down...');
            await this.disconnectFromRabbitMQ();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            this.LOG.info('Received SIGTERM. Gracefully shutting down...');
            await this.disconnectFromRabbitMQ();
            process.exit(0);
        });
    }

    private async startWorker(): Promise<void> {
        this.ensureChannelInitialized();

        this.channel?.consume(this.paymentQueue, async (msg) => {
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
        this.ensureChannelInitialized();

        try {
            const messageBuffer = Buffer.from(JSON.stringify(message));
            await this.channel?.sendToQueue(this.paymentQueue, messageBuffer, { persistent: true });
            this.LOG.info(`Message sent to queue ${this.paymentQueue}:`, message);
        } catch (error) {
            this.LOG.error('Error publishing message to RabbitMQ:', error);
        }
    }

    public async sendEmail({ data }: { data: any }): Promise<void> {
        this.data = data;
        await this.produce();
    }

    private async produce(): Promise<void> {
        this.ensureChannelInitialized();

        try {
            const messageBuffer = Buffer.from(JSON.stringify(this.data));
            await this.channel?.sendToQueue(this.emailQueue, messageBuffer, { persistent: true });
            this.LOG.info(`Message added to queue: ${this.emailQueue}`);
        } catch (error) {
            this.LOG.error('Failed to produce message:', error);
        }
    }

    private validateEmailMessage(data: any): void {
        const schema = Joi.object({
            to: Joi.string().email().required(),
            replyTo: Joi.string().email().required(),
            from: Joi.string().required(),
            subject: Joi.string().required(),
            html: Joi.string().required()
        });

        const { error } = schema.validate(data);
        if (error) {
            throw new Error(`Invalid email message structure: ${error.message}`);
        }
    }

    private async consumeEmails(): Promise<void> {
        this.ensureChannelInitialized();

        try {
            await this.channel?.consume(
                this.emailQueue,
                async (msg: Message | null) => {
                    if (!msg) return;

                    const data = JSON.parse(msg.content.toString());
                    const retryCount = (msg.properties.headers ? msg.properties.headers['x-retry-count'] : 0) || 0 + 1;

                    try {
                        this.validateEmailMessage(data); // Validate message before sending
                        await sendMailService.sendMail(data);
                        this.LOG.info(`Email sent successfully to ${data.to}`);
                        this.channel?.ack(msg); // Acknowledge success
                    } catch (error) {
                        this.LOG.error(`Failed to send email, retry count: ${retryCount}`, error);

                        if (retryCount >= this.retryLimit) {
                            this.LOG.error('Exceeded retry limit, moving message to dead-letter queue');
                            await this.moveToDeadLetterQueue(msg); // Move to DLQ
                        } else {
                            this.LOG.info('Requeueing message for retry');
                            this.channel?.nack(msg, false, true); // Requeue for retry
                        }
                    }
                },
                { noAck: false } // Enable manual acknowledgment
            );
        } catch (error) {
            this.LOG.error('Failed to consume messages:', error);
        }
    }

    // Move failed messages to Dead-Letter Queue (DLQ)
    private async moveToDeadLetterQueue(msg: Message): Promise<void> {
        try {
            const retryCount = (msg.properties.headers ? msg.properties.headers['x-retry-count'] : 0) || 0 + 1;

            const updatedHeaders = { ...msg.properties.headers, 'x-retry-count': retryCount };

            // Publish to Dead-Letter Queue (DLQ)
            await this.channel?.sendToQueue(
                this.deadLetterQueue,
                msg.content,
                { headers: updatedHeaders, persistent: true }
            );

            this.channel?.ack(msg); // Acknowledge original message after moving to DLQ
        } catch (error) {
            this.LOG.error('Error moving message to DLQ:', error);
        }
    }
}

export default RabbitMQService;