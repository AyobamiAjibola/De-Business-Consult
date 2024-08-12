import mongoose, { Document, Schema } from 'mongoose';

interface IServices {
    name: string;
    cost: string;
    description: string;
};

const clientSchema = new Schema<IServices>({
    name: { type: String },
    cost: { type: String },
    description: { type: String }
}, { timestamps: true });
  
export interface IServicesModel extends Document, IServices {};
  
const Services: any = mongoose.model<IServicesModel>('Services', clientSchema as any);

export default Services