import mongoose, { Document, Schema } from 'mongoose';

interface ISignUpAtempt {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    status: string;
    expiredAt: number;
    dob: Date;
    companyName: string;
    additionalInformation: string;
};

const signUpAtemptSchema = new Schema<ISignUpAtempt>({
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    email: { type: String },
    status: { type: String, default: 'pending' },
    expiredAt: { type: Number },
    dob: { type: Date },
    companyName: { type: String },
    additionalInformation: { type: String },
}, { timestamps: true });
  
export interface ISignUpAtemptModel extends Document, ISignUpAtempt {}
  
const SignUpAtempt: any = mongoose.model<ISignUpAtemptModel>('SignUpAtempt', signUpAtemptSchema as any);

export default SignUpAtempt