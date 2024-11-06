import mongoose, { Document, Schema } from 'mongoose';

interface IAppointmentConfig {
    name: string,
    amount: string,
    service: mongoose.Types.ObjectId
}

const appointmentConfigSchema = new Schema<IAppointmentConfig>({
    name: { type: String },
    service: { type: Schema.Types.ObjectId, ref: 'Services' },
    amount: { type: String }
});

appointmentConfigSchema.pre(['findOne', 'find'], function (next) {
    this.populate('service')
    next();
})

export interface IAppointmentConfigModel extends Document, IAppointmentConfig {}

const AppointmentConfig: any = mongoose.model<IAppointmentConfigModel>('AppointmentConfig', appointmentConfigSchema as any);

export default AppointmentConfig;