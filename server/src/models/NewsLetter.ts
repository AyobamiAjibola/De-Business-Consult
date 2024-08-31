import mongoose, { Document, Schema } from 'mongoose';

export enum NewsLetterStatus {
    Draft = 'draft',
    Scheduled = 'scheduled',
    Sent = 'sent'
}

interface INewsLetter {
    files: string[],
    content: string,
    status: {
        item: NewsLetterStatus,
        date: Date | null
    }
}

const newsLetterSchema = new Schema<INewsLetter>({
    files: [{ type: String }],
    content: { type: String },
    status: { 
        item: {
            type: String,
            enum: Object.values(NewsLetterStatus)
        },
        date: { type: Date, allowNull: true, default: null }
    }
}, { timestamps: true });

export interface INewsLetterModel extends Document, INewsLetter {}

const NewsLetter: any = mongoose.model<INewsLetterModel>('NewsLetter', newsLetterSchema as any);

export default NewsLetter;