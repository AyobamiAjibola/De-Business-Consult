import mongoose, { Document, Schema } from 'mongoose';

interface IClient {
    firstName: string;
    lastName: string;
    phone: string;
    image: string;
    status: boolean;
    email: string;
    password: string,
    passwordReset: {
      exp: number,
      code: string
    },
    dob: Date,
    companyName: string,
    additionalInformation: string
};

const clientSchema = new Schema<IClient>({
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    image: { type: String },
    status: { type: Boolean, default: true },
    email: { type: String },
    companyName: { type: String },
    password: { type: String },
    additionalInformation: { type: String },
    dob: { type: Date, allowNull: true },
    passwordReset: {
        exp: { type: Number },
        code: { type: String },
    },
}, { timestamps: true });
  
export interface IClientModel extends Document, IClient {}
  
const Client: any = mongoose.model<IClientModel>('Client', clientSchema as any);

export default Client