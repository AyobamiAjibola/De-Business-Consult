import mongoose, { Document, Schema } from 'mongoose';

interface IAppointmentConfig {
    amount: string,
    service: number
}

const appointmentConfigSchema = new Schema<IAppointmentConfig>({
    amount: { type: String },
    service: { type: Number }
});

export interface IAppointmentConfigModel extends Document, IAppointmentConfig {}

const AppointmentConfig: any = mongoose.model<IAppointmentConfigModel>('AppointmentConfig', appointmentConfigSchema as any);

export default AppointmentConfig;