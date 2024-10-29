import mongoose, { Document, Schema } from 'mongoose';

export enum INotification {
    Sms = 'sms',
    Email = 'email'
}

export enum ClientStatus {
    Active = 'active',
    Inactive = 'inactive'
}

interface IClient {
    firstName: string;
    lastName: string;
    phone: string;
    image: string;
    status: ClientStatus;
    email: string;
    password: string,
    passwordReset: {
      exp: number,
      code: string
    },
    dob: Date,
    companyName: string,
    additionalInformation: string,
    smsNotification: boolean,
    emailNotification: boolean,
    newsAndUpdate: boolean,
    isClient: boolean
};

const clientSchema = new Schema<IClient>({
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    image: { type: String },
    status: { 
        type: String, 
        enum: Object.values(ClientStatus), 
        default: ClientStatus.Active 
    },
    email: { type: String },
    companyName: { type: String },
    password: { type: String },
    additionalInformation: { type: String },
    dob: { type: Date, allowNull: true },
    passwordReset: {
        exp: { type: Number },
        code: { type: String },
    },
    smsNotification: { type: Boolean, default: false },
    emailNotification: { type: Boolean, default: false },
    newsAndUpdate: { type: Boolean, default: false },
    isClient: { type: Boolean, default: false }
}, { timestamps: true });
  
export interface IClientModel extends Document, IClient {}
  
const Client: any = mongoose.model<IClientModel>('Client', clientSchema as any);

export default Client