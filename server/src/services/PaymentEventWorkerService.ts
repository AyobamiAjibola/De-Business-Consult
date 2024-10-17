import Stripe from 'stripe';
import datasources from './dao';
import { ITransactionModel, PaymentStatus, PaymentType } from '../models/Transaction';
import payment_success_template from '../resources/template/email/payment_success_template';
import rabbitMqService from "../config/RabbitMQConfig";
import appointment_template from '../resources/template/email/appointment';
import { AppointmentStatus } from '../models/Appointment';
import moment from "moment-timezone";
import { scheduleNotifications } from './BullSchedulerService';

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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

            const { paymentType, itemId } = charge.metadata;

            if(paymentType === "appointment") {
                
                const appointment = await datasources.appointmentDAOService.findById(itemId);

                if(!appointment) return;

                const servicePromises = appointment.services.map(async (serviceId) => {
                    const service = await datasources.servicesDAOService.findById(serviceId);
                    return service?.name;
                });

                const serviceNames = (await Promise.all(servicePromises)).filter(Boolean);

                const mail = appointment_template({
                    date: moment(appointment.date).tz(timeZone).format('DD-MM-YYYY'),
                    time: moment(appointment.time).tz(timeZone).format('h:mm a'),
                    services: serviceNames.join(', '),
                    appointmentId: appointment.appointmentId
                });
    
                const emailPayload = {
                    to: appointment.email,
                    replyTo: process.env.SMTP_EMAIL_FROM,
                    from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
                    subject: `De Business Consult.`,
                    html: mail
                }
                
                await rabbitMqService.sendEmail({data: emailPayload});
                await scheduleNotifications({ 
                    appointmentTime: appointment.time, 
                    email: appointment.email,
                    appointmentId: appointment.appointmentId
                });
            }

            break;

        case 'charge.updated':
            try {
                const updatedCharge = event.data.object as Stripe.Charge;
                console.log('Charge was updated!');
                
                const { paymentType, recipientEmail, itemNo } = updatedCharge.metadata;

                const chargeTransaction = await datasources.transactionDAOService.findByAny({
                    [paymentType]: updatedCharge.metadata.itemId,
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

                    const transaction = await datasources.transactionDAOService.updateByAny({ _id: chargeTransaction._id }, updateData);

                    //SEND OTP TO USER EMAIL
                    const mail = payment_success_template({
                        itemNo,
                        paymentType,
                        receipt: transaction?.receiptUrl
                    });

                    const emailPayload = {
                        to: recipientEmail,
                        replyTo: process.env.SMTP_EMAIL_FROM,
                        from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
                        subject: `De Business Consult.`,
                        html: mail
                    }

                    await rabbitMqService.sendEmail({data: emailPayload});
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

