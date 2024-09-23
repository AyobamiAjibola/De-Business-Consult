import { Request } from 'express';
import Stripe from 'stripe';
import settings from '../config/settings';

class StripeWebhookService {
    private stripe: Stripe;
    private endpointSecret: string;

    constructor(endpointSecret: string) {
        this.stripe = new Stripe(settings.stripe.secret_key, {
            apiVersion: settings.stripe.api_version
        });
        this.endpointSecret = endpointSecret;
    }

    public verifyEvent(req: Request): Promise<Stripe.Event> {

        const sig = req.headers['stripe-signature'] as string;

        return new Promise((resolve, reject) => {
            try {
                const event = this.stripe.webhooks.constructEvent(req.body, sig, this.endpointSecret);
                resolve(event);
            } catch (err) {
                reject(new Error(`⚠️ Webhook signature verification failed: ${(err as Error).message}`));
            }
        });
    }

    // Handle Stripe event
    public async handleEvent(event: Stripe.Event): Promise<{ status: string; message: string }> {
        return new Promise((resolve) => {
            console.log(event.type, 'event type')
            switch (event.type) {
                case 'payment_intent.succeeded':
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log(paymentIntent, 'PaymentIntent was successful!');
                // Perform backend actions such as updating your database here
                resolve({ status: 'success', message: 'PaymentIntent was successful' });
                break;
                
                case 'payment_intent.created':
                    const paymentIntentCreated = event.data.object as Stripe.PaymentIntent;
                    console.log(paymentIntentCreated, 'PaymentIntent was created!');
                    // Here, you can take additional actions if needed, like notifying the user
                    resolve({ status: 'success', message: 'PaymentIntent was created' });
                    break;
        
                default:
                console.log(`Unhandled event type ${event.type}`);
                resolve({ status: 'error', message: `Unhandled event type ${event.type}` });
                break;
            }
        });
    }
}

export default StripeWebhookService;
