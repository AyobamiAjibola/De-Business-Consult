import mongoose, { Document, Schema } from 'mongoose';

export enum AppointmentStatus {
    Confirmed = 'confirmed',
    Completed = 'completed',
    Canceled = 'canceled',
    Pending = 'pending'
}

interface IAppointment {
    service: mongoose.Types.ObjectId,
    date: Date,
    time: Date,
    status: AppointmentStatus,
    appointmentId: string,
    additionalInfo: string,
    client: mongoose.Types.ObjectId | null,
    reasonForCanceling: string,
    transaction: mongoose.Types.ObjectId,
    email: string | null,
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    
};

const appointmentSchema = new Schema<IAppointment>({
    service: { type: Schema.Types.ObjectId, ref: 'Services' },
    date: { type: Date },
    time: { type: Date },
    status: {
        type: String,
        enum: Object.values(AppointmentStatus)
    },
    appointmentId: { type: String, unique: true },
    additionalInfo: { type: String },
    client: { type: Schema.Types.ObjectId, allowNull: true, ref: 'Client' },
    reasonForCanceling: { type: String, allowNull: true },
    transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    email: { type: String, allowNull: true },
    firstName: { type: String, allowNull: true },
    lastName: { type: String, allowNull: true },
    phone: { type: String, allowNull: true },
}, { timestamps: true });

appointmentSchema.pre(['findOne', 'find'], function (next) {
    this.populate('service')
        .populate({
            path: 'client',
            select: 'firstName lastName email phone image companyName'
        });
    next();
})
  
export interface IAppointmentModel extends Document, IAppointment {};
  
const Appointment: any = mongoose.model<IAppointmentModel>('Appointment', appointmentSchema as any);

export default Appointment