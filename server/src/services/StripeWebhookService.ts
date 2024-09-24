import { Request } from 'express';
import Stripe from 'stripe';
import stripe from '../utils/StripeConfig';
import datasources from './dao';
import { ITransactionModel, PaymentStatus } from '../models/Transaction';

class StripeWebhookService {
    private endpointSecret: string;

    constructor(endpointSecret: string) {
        this.endpointSecret = endpointSecret;
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

    // Handle Stripe event
    public async handleEvent(event: Stripe.Event): Promise<{ status: string; message: string }> {
        return new Promise( async (resolve) => {
            let paymentIntentId = '';
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object as Stripe.PaymentIntent;
                    console.log('PaymentIntent was successful!');
                    const transaction = await datasources.transactionDAOService.findByAny({ application: paymentIntent.metadata.applicationId });
                    await datasources.transactionDAOService.update(
                        { _id: transaction?._id },
                        { paymentIntentDate: paymentIntent.created, status: PaymentStatus.PaymentInProgress }
                    )
                    resolve({ status: 'success', message: 'PaymentIntent was successful' });
                    break;

                case 'charge.succeeded':
                    const charge = event.data.object as Stripe.Charge;
                    console.log('Charge was successful!');
                    resolve({ status: 'success', message: 'Charge was successful' });
                    break;

                case 'charge.updated':
                    const updatedCharge = event.data.object as Stripe.Charge;
                    console.log('Charge was updated!', updatedCharge.metadata);
                    const chargeTransaction = await datasources.transactionDAOService.findByAny(
                        { 
                            application: updatedCharge.metadata.applicationId,
                            paymentIntentId: updatedCharge.billing_details.name
                        }
                    );
                    await datasources.transactionDAOService.update(
                        { _id: chargeTransaction?._id },
                        {
                            chargeId: updatedCharge.id, 
                            status: PaymentStatus.PaymentSuccessful,
                            object: updatedCharge.object,
                            last4: updatedCharge.payment_method_details?.card?.last4,
                            expMonth: updatedCharge.payment_method_details?.card?.exp_month,
                            expYear: updatedCharge.payment_method_details?.card?.exp_year,
                            channel: updatedCharge.payment_method_details?.card?.network,
                            brand: updatedCharge.payment_method_details?.card?.brand,
                            receiptUrl: updatedCharge.receipt_url,
                            paidAt: updatedCharge.created,
                            paid: updatedCharge.paid
                        }
                    )
                    resolve({ status: 'success', message: 'Charge was updated' });
                    break;
                
                case 'payment_intent.created':
                    const paymentIntentCreated = event.data.object as Stripe.PaymentIntent;
                    console.log('PaymentIntent was created!');
                    paymentIntentId = paymentIntentCreated.id
                    await datasources.transactionDAOService.create({
                        paymentIntentId: paymentIntentCreated.id,
                        amount: paymentIntentCreated.amount,
                        object: paymentIntentCreated.object,
                        currency: paymentIntentCreated.currency,
                        paymentIntentDate: paymentIntentCreated.created,
                        application: paymentIntentCreated.metadata.applicationId as any
                    } as ITransactionModel)
                    resolve({ status: 'success', message: 'PaymentIntent was created' });
                    break;

                case 'payment_intent.canceled':
                    const paymentIntentCanceled = event.data.object as Stripe.PaymentIntent;
                    console.log('Payment intent canceled')
                    const transactionCanceled = await datasources.transactionDAOService.findByAny({ application: paymentIntentCanceled.metadata.applicationId });
                    await datasources.transactionDAOService.update(
                        { _id: transactionCanceled?._id },
                        { paymentIntentDate: paymentIntentCanceled.created, status: PaymentStatus.PaymentCanceled }
                    )
                    resolve({ status: 'success', message: 'PaymentIntent canceled' });
                    break;

                case 'checkout.session.completed':
                    const checkoutCompleted = event.data.object as Stripe.Checkout.Session;
                    console.log(checkoutCompleted, 'Checkout session was successful!');
                    resolve({ status: 'success', message: 'Checkout session completed' });
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
