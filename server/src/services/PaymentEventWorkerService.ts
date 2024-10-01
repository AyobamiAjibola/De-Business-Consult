import Stripe from 'stripe';
import datasources from './dao';
import { ITransactionModel, PaymentStatus, PaymentType } from '../models/Transaction';

export async function processEvent(event: Stripe.Event) {
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log('PaymentIntent was successful!');
            const transactionKey = paymentIntent.metadata.paymentType === PaymentType.Application ? 'application' : 'appointment';

            const transaction = await datasources.transactionDAOService.findByAny({
                [transactionKey]: paymentIntent.metadata.itemId
            });
            
            await datasources.transactionDAOService.update(
                { _id: transaction?._id },
                { paymentIntentDate: paymentIntent.created, status: PaymentStatus.PaymentInProgress }
            )
            break;

        case 'charge.succeeded':
            const charge = event.data.object as Stripe.Charge;
            console.log('Charge was successful!');
            break;

        case 'charge.updated':
            try {
                const updatedCharge = event.data.object as Stripe.Charge;
                console.log('Charge was updated!');
                
                const paymentTypeField = updatedCharge.metadata.paymentType

                const chargeTransaction = await datasources.transactionDAOService.findByAny({
                    [paymentTypeField]: updatedCharge.metadata.itemId,
                    paymentIntentId: updatedCharge.billing_details.name
                });

                if (chargeTransaction) {
                    const updateData = {
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
                    };

                    await datasources.transactionDAOService.update({ _id: chargeTransaction._id }, updateData);
                }

            } catch (error) {
                console.error('Error in charge.updated:', error);
            }
            break;
        
        case 'payment_intent.created':
            try {
                const paymentIntentCreated = event.data.object as Stripe.PaymentIntent;
                console.log('PaymentIntent was created!');
                
                const { id: paymentIntentId, amount, object, currency, created: paymentIntentDate, metadata } = paymentIntentCreated;
        
                // Create a new transaction
                const newTransaction = await datasources.transactionDAOService.create({
                    paymentIntentId,
                    amount,
                    object,
                    currency,
                    paymentIntentDate,
                    application: metadata.paymentType === PaymentType.Application ? metadata.itemId : null,
                    appointment: metadata.paymentType === PaymentType.Appointment ? metadata.itemId : null,
                    paymentType: metadata.paymentType
                } as ITransactionModel);
                
                // // Determine the DAO service based on payment type
                const daoService = metadata.paymentType === PaymentType.Application 
                    ? datasources.applicationDAOService 
                    : datasources.appointmentDAOService;
        
                // Update the application or appointment
                await daoService.update(
                    { _id: metadata.itemId },
                    { transaction: newTransaction._id }
                );
        
            } catch (error) {
                console.error('Error processing payment_intent.created:', error);
            }
            break;

        case 'payment_intent.canceled':
            const paymentIntentCanceled = event.data.object as Stripe.PaymentIntent;
            console.log('Payment intent canceled')
            const transactionCancelKey = paymentIntentCanceled.metadata.paymentType === PaymentType.Application ? 'application' : 'appointment';

            const transactionCanceled = await datasources.transactionDAOService.findByAny({
                [transactionCancelKey]: paymentIntentCanceled.metadata.itemId
            });

            await datasources.transactionDAOService.update(
                { _id: transactionCanceled?._id },
                { paymentIntentDate: paymentIntentCanceled.created, status: PaymentStatus.PaymentCanceled }
            )
            break;

        case 'checkout.session.completed':
            const checkoutCompleted = event.data.object as Stripe.Checkout.Session;
            console.log(checkoutCompleted, 'Checkout session was successful!');
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
            break;
    }
}

