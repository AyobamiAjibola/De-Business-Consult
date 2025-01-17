import { Connection, Channel, Message } from 'amqplib';
import Stripe from 'stripe';
import { processEvent } from './PaymentEventWorkerService';
import queue from '../config/queue';
import { Logger } from 'winston';
import SendMailService from './SendMailService';
import LOG from '../config/AppLoggerConfig';
import Joi from 'joi';
import datasources from './dao';
import { IChatMessageModel } from '../models/ChatMessages';
import { STATUSES } from '../config/constants';
import { processCalendlyEvent } from './CalendlyEventWorker';
import TwilioService from './TwillioService';

const sendMailService = new SendMailService();
const twilioService = new TwilioService()

class RabbitMQService {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private readonly paymentQueue: string;
    private readonly emailQueue: string;
    private readonly textQueue: string;
    private readonly deadLetterQueue: string;
    private readonly chatQueue: string;
    private readonly chatSeen: string;
    private readonly calendly: string;
    private data: any | null = null;
    private readonly LOG: Logger = LOG;
    private retryLimit = 3;

    constructor(
        paymentQueue: string, 
        emailQueue: string, 
        textQueue: string, 
        deadLetterQueue: string,
        chatQueue: string,
        chatSeen: string,
        calendly: string
    ) {
        this.paymentQueue = paymentQueue;
        this.emailQueue = emailQueue;
        this.textQueue = textQueue;
        this.deadLetterQueue = deadLetterQueue;
        this.chatQueue = chatQueue;
        this.chatSeen = chatSeen;
        this.calendly = calendly;
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
                this.channel.assertQueue(this.textQueue, { durable: true }),
                this.channel.assertQueue(this.deadLetterQueue, { durable: true }),
                this.channel.assertQueue(this.chatQueue, { durable: true }),
                this.channel.assertQueue(this.chatSeen, { durable: true }),
                this.channel.assertQueue(this.calendly, { durable: true })
            ]);

            // Prefetching to limit unacknowledged messages
            this.channel.prefetch(10); // Process max 10 messages at a time

            this.LOG.info(`Connected to queues: 
                            ${this.paymentQueue}, 
                            ${this.emailQueue}, 
                            ${this.textQueue}, 
                            ${this.deadLetterQueue},
                            ${this.chatQueue}, 
                            ${this.chatSeen}, 
                            ${this.calendly}
                        `);

            await this.startWorker();
            await this.consumeEmails();
            await this.storeChatMessageConsumer();
            await this.chatSeenConsumer();
            await this.startCalendlyWorker();
            await this.consumeText();
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

    private async startCalendlyWorker(): Promise<void> {
        this.ensureChannelInitialized();

        this.channel?.consume(this.calendly, async (msg) => {
            if (!msg) return;

            const event: Stripe.Event = JSON.parse(msg.content.toString());

            try {
                await processCalendlyEvent(event);
                this.channel?.ack(msg); // Acknowledge after successful processing
            } catch (error) {
                this.LOG.error('Error processing event:', error);
                this.channel?.nack(msg); // Reject on failure
            }
        });
    }

    public async publishMessageToQueue(queue: string, message: any): Promise<void> {
        this.ensureChannelInitialized();

        try {
            const messageBuffer = Buffer.from(JSON.stringify(message));
            await this.channel?.sendToQueue(queue, messageBuffer, { persistent: true });
            this.LOG.info(`Message sent to queue ${queue}`);
        } catch (error) {
            this.LOG.error('Error publishing message to RabbitMQ:', error);
        }
    }

    public async sendSMS({ data }: { data: any }): Promise<void> {
        this.data = data;
        await this.produceTextMessage();
    }

    public async sendEmail({ data }: { data: any }): Promise<void> {
        this.data = data;
        await this.produce();
    }

    private async produceTextMessage(): Promise<void> {
        this.ensureChannelInitialized();

        try {
            const messageBuffer = Buffer.from(JSON.stringify(this.data));
            await this.channel?.sendToQueue(this.textQueue, messageBuffer, { persistent: true });
            this.LOG.info(`Message added to queue: ${this.textQueue}`);
        } catch (error) {
            this.LOG.error('Failed to produce message:', error);
        }
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
            to: Joi.string().required(),
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

    private validateTextMessage(data: any): void {
        const schema = Joi.object({
            to: Joi.string().required(),
            message: Joi.string().required()
        });

        const { error } = schema.validate(data);
        if (error) {
            throw new Error(`Invalid text message structure: ${error.message}`);
        }
    }

    private async consumeText(): Promise<void> {
        this.ensureChannelInitialized();

        try {
            await this.channel?.consume(
                this.textQueue,
                async (msg: Message | null) => {
                    if (!msg) return;

                    const data = JSON.parse(msg.content.toString());
                    const retryCount = (msg.properties.headers ? msg.properties.headers['x-retry-count'] : 0) || 0 + 1;

                    try {
                        // this.validateTextMessage(data);
                        await twilioService.sendSMS(data);
                        this.LOG.info(`Text sent successfully to ${data.to}`);
                        this.channel?.ack(msg); // Acknowledge success
                    } catch (error) {
                        this.LOG.error(`Failed to send text, retry count: ${retryCount}`, error);

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

    private async storeChatMessageConsumer() {
        this.ensureChannelInitialized();

        try {
          await this.channel?.consume(
            this.chatQueue,
            async (message: Message | null) => {
                if (!message) return;
                
                const messageData = JSON.parse(message.content.toString());
                const retryCount = (message.properties.headers ? message.properties.headers['x-retry-count'] : 0) || 0 + 1;

                try {
                    // Check if the message already exists in the DB (to avoid duplicates)
                    const existingMessage = await datasources.chatMessageDAOService.findByAny({ messageId: messageData.messageId });
                    if (!existingMessage) {
                        await datasources.chatMessageDAOService.create({
                            messageId: messageData.messageId,
                            chatId: messageData.chatId,
                            message: messageData.message,
                            status: STATUSES.sent,
                            senderId: messageData.senderId,
                            fileUrl: messageData.fileUrl,
                            fileName: messageData.fileName
                        } as IChatMessageModel);
                        
                        this.channel?.ack(message); // Acknowledge success
                    } else {
                        // If message already exists, just acknowledge it
                        this.channel?.ack(message);
                    }

                } catch (error) {
                    this.LOG.error(`Failed to send chat message, retry count: ${retryCount}`, error);
                    if (retryCount >= this.retryLimit) {
                        this.LOG.error('Exceeded retry limit, moving message to dead-letter queue');
                        await this.moveToDeadLetterQueue(message); // Move to DLQ
                    } else {
                        this.LOG.info('Requeueing message for retry');
                        this.channel?.nack(message, false, true); // Requeue for retry
                    }
                }
            },
            { noAck: false } // Ensure messages are not removed from the queue until acknowledged
          );
        } catch (error) {
            this.LOG.error('Error consuming messages:', error);
        }
    }

    private async chatSeenConsumer(): Promise<void> {
        this.ensureChannelInitialized();

        try {
            await this.channel?.consume(
                this.chatSeen,
                async (msg: Message | null) => {
                    if (!msg) return;

                    const data = JSON.parse(msg.content.toString());

                    try {
                        await datasources.chatMessageDAOService.updateMany(
                            { chatId: data.chatId, status: { $ne: STATUSES.read } },
                            { $set: { status: STATUSES.read } }
                        )

                        this.channel?.ack(msg); // Acknowledge success
                    } catch (error) {
                        this.LOG.error(`Failed to update chat messages`, error);
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