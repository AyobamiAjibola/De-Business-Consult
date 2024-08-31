import mongoose, { Document, Schema } from 'mongoose';

export enum SubscriberStatus {
    Active = 'active',
    Inactive = 'inactive'
}

interface ISubscriber {
    firstName: string,
    lastName: string,
    email: string,
    status: SubscriberStatus
}

const subscriberSchema = new Schema<ISubscriber>({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    status: {
        type: String,
        enum: Object.values(SubscriberStatus),
        default: SubscriberStatus.Active
    },
}, { timestamps: true});

export interface ISubscriberModel extends Document, ISubscriber {}

const Subscriber: any = mongoose.model<ISubscriberModel>('Subscriber', subscriberSchema as any);

export default Subscriber;