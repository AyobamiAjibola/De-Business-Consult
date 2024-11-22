import mongoose, { Document, Schema } from 'mongoose';

export enum AppointmentStatus {
    Not_Booked = 'not-booked',
    Completed = 'completed',
    Canceled = 'canceled',
    Upcoming = 'upcoming',
    No_Show = 'no-show'
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
    companyName: string | null;
    phone: string | null;
    calendly_event: string;
    rescheduled: boolean;
    no_show: boolean;
    start_time: Date,
    end_time: Date,
    reschedule_url: string | null,
    createdAt: Date,
    event_detail: {
        event_guests: string,
        invitees_counter: string,
        meeting_notes_html: string,
        meeting_notes_plain: string,
        timezone: string,
        invitee: string,
        questions_and_answers: string,
        mark_no_show_uri: string
    }
};

const appointmentSchema = new Schema<IAppointment>({
    event_detail: {
        event_guests: { type: String },
        invitees_counter: { type: String },
        meeting_notes_html: { type: String, allowNull: true },
        meeting_notes_plain: { type: String, allowNull: true },
        timezone: { type: String },
        invitee: { type: String },
        questions_and_answers: { type: String },
        mark_no_show_uri: { type: String }
    },
    service: { type: Schema.Types.ObjectId, ref: 'Services' },
    date: { type: Date },
    time: { type: Date },
    status: {
        type: String,
        enum: Object.values(AppointmentStatus),
        default: AppointmentStatus.Not_Booked
    },
    appointmentId: { type: String, unique: true },
    additionalInfo: { type: String },
    client: { type: Schema.Types.ObjectId, allowNull: true, ref: 'Client' },
    reasonForCanceling: { type: String, allowNull: true },
    transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    email: { type: String, allowNull: true },
    firstName: { type: String, allowNull: true },
    lastName: { type: String, allowNull: true },
    companyName: { type: String, allowNull: true },
    phone: { type: String, allowNull: true },
    calendly_event: { type: String },
    rescheduled: { type: Boolean, default: false },
    no_show: { type: Boolean, default: false },
    start_time: { type: Date },
    end_time: { type: Date },
    reschedule_url: { type: String },
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