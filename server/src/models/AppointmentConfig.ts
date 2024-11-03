import mongoose, { Document, Schema } from 'mongoose';

interface IAppointmentConfig {
    name: string,
    amount: string,
    service: number
}

const appointmentConfigSchema = new Schema<IAppointmentConfig>({
    name: { type: String },
    amount: { type: String },
    service: { type: Number }
});

export interface IAppointmentConfigModel extends Document, IAppointmentConfig {}

const AppointmentConfig: any = mongoose.model<IAppointmentConfigModel>('AppointmentConfig', appointmentConfigSchema as any);

export default AppointmentConfig;