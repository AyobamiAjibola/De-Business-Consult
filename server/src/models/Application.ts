import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentType {
    Karma = 'karma',
    Card = 'card',
    Cash_App = 'cash_app',
    Afterpay = 'afterpay'
}

export enum ApplicationStatus {
    InReview = 'in_review',
    Successful = 'successful',
    Declined = 'declined',
    Submitted = 'submitted'
}

interface IFiles {
    service: mongoose.Types.ObjectId,
    docs: string[],
    additionalInformation: string
}

interface IApplication {
    services: IFiles[],
    fee: string,
    paymentType: PaymentType,
    status: ApplicationStatus,
    applicationId: string,
    documentAttached: number,
    client: mongoose.Types.ObjectId,
    successful: string[],
    reasonForDecline: string
};

const applicationSchema = new Schema<IApplication>({
    services: [{ 
        service: { type: Schema.Types.ObjectId, ref: 'Services' },
        docs: [{ type: String }],
        additionalInformation: { type: String }
    }],
    fee: { type: String },
    paymentType: { type: String },
    status: {
        type: String,
        enum: Object.values(ApplicationStatus)
    },
    applicationId: { type: String },
    documentAttached: { type: Number },
    client: { type: Schema.Types.ObjectId, ref: 'Client' },
    successful: [{ type: String }],
    reasonForDecline: { type: String, allowNull: true }
}, { timestamps: true });

applicationSchema.pre(['findOne', 'find'], function (next) {
    this.populate('services.service')
    .populate({
        path: 'client',
        select: 'firstName lastName email phone image companyName'
    });
    next();
})
  
export interface IApplicationModel extends Document, IApplication {};
  
const Application: any = mongoose.model<IApplicationModel>('Application', applicationSchema as any);

export default Application