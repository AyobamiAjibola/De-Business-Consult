import { Request } from 'express';
import Stripe from 'stripe';
import stripe from '../config/StripeConfig';
import RabbitMQService from './RabbitMQService';
import { QUEUE_EVENTS_PAYMENT } from '../config/constants';

class StripeWebhookService {
    private endpointSecret: string;
    private rabbitMQService: RabbitMQService;

    constructor(endpointSecret: string, rabbitMQService: RabbitMQService) {
        this.endpointSecret = endpointSecret;
        this.rabbitMQService = rabbitMQService;
    }

    public verifyEvent(req: Request): Promise<Stripe.Event> {

        const sig = req.headers['stripe-signature'] as string;

        return new Promise((resolve, reject) => {
            try {
                const event = stripe.webhooks.constructEvent(req.body, sig, this.endpointSecret);
                resolve(event);
            } catch (err) {
                reject(new Error(`⚠️ Webhook signature verification failed: ${(err as Error).message}`));
            }
        });
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    public async handleEvent(event: Stripe.Event): Promise<{ status: string; message: string }> {
        try {
            await this.rabbitMQService.publishMessageToQueue(QUEUE_EVENTS_PAYMENT.name, event)
            return { status: 'success', message: 'Event published to RabbitMQ for processing' };
        } catch (error) {
            console.error('Error publishing to RabbitMQ:', error);
            return { status: 'error', message: 'Failed to publish event to RabbitMQ' };
        }
    }

}

export default StripeWebhookService;
