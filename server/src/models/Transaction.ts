import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentStatus {
    NotPaid = 'not_paid',
    PaymentSuccessful = 'payment_successful',
    PaymentCanceled = 'payment_canceled',
    PaymentFailed = 'payment_failed',
    PaymentInProgress = 'payment_in_progress'
}

export enum PaymentType {
    Application = 'application',
    Appointment = 'appointment'
}

interface ITransactions {
    paymentIntentId: string,
    chargeId: string,
    amount: number,
    status: PaymentStatus,
    object: string,
    last4: string | null,
    expMonth: string | null,
    expYear: string | null,
    channel: string | null,
    brand: string | null,
    receiptUrl: string | null,
    currency: string,
    paymentIntentDate: number | null,
    paidAt: number | null,
    paid: boolean,
    application: mongoose.Types.ObjectId | null;
    appointment: mongoose.Types.ObjectId | null;
    paymentType: PaymentType
};

const transactionSchema = new Schema<ITransactions>({
    paymentIntentId: { type: String },
    chargeId: { type: String, allowNull: true },
    amount: { type: Number },
    status: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.NotPaid
    },
    object: { type: String, allowNull: true },
    last4: { type: String, allowNull: true },
    expMonth: { type: String, allowNull: true },
    expYear: { type: String, allowNull: true },
    channel: { type: String, allowNull: true },
    brand: { type: String, allowNull: true },
    receiptUrl: { type: String, allowNull: true },
    currency: { type: String },
    paymentIntentDate: { type: Number, allowNull: true },
    paidAt: { type: Number, allowNull: true },
    paid: { type: Boolean, default: false },
    application: { type: Schema.Types.ObjectId, allowNull: true, ref: 'Application' },
    appointment: { type: Schema.Types.ObjectId, allowNull: true, ref: 'Appointment' },
    paymentType: {
        type: String,
        enum: Object.values(PaymentType)
    },
});

transactionSchema.pre(['findOne', 'find'], function (next) {
    this.populate({
        path: 'application',
        select: 'client applicationId status'
    })
    .populate({
        path: 'appointment',
        select: 'client status'
    });
    next();
});

export interface ITransactionModel extends Document, ITransactions {}
  
const Transaction: any = mongoose.model<ITransactionModel>('Transaction', transactionSchema as any);

export default Transaction