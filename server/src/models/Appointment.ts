import mongoose, { Document, Schema } from 'mongoose';

export enum AppointmentStatus {
    Confirmed = 'confirmed',
    Completed = 'completed',
    Canceled = 'canceled',
    Pending = 'pending'
}

interface IAppointment {
    services: mongoose.Types.ObjectId[],
    date: Date,
    time: Date,
    status: AppointmentStatus,
    appointmentId: string,
    additionalInfo: string,
    client: mongoose.Types.ObjectId,
    reasonForCanceling: string
};

const appointmentSchema = new Schema<IAppointment>({
    services: [{ type: Schema.Types.ObjectId, ref: 'Services' }],
    date: { type: Date },
    time: { type: Date },
    status: {
        type: String,
        enum: Object.values(AppointmentStatus)
    },
    appointmentId: { type: String },
    additionalInfo: { type: String },
    client: { type: Schema.Types.ObjectId, ref: 'Client' },
    reasonForCanceling: { type: String, allowNull: true }
}, { timestamps: true });

appointmentSchema.pre(['findOne', 'find'], function (next) {
    this.populate('services')
    .populate({
        path: 'client',
        select: 'firstName lastName email phone image companyName'
    });
    next();
})
  
export interface IAppointmentModel extends Document, IAppointment {};
  
const Appointment: any = mongoose.model<IAppointmentModel>('Appointment', appointmentSchema as any);

export default Appointment