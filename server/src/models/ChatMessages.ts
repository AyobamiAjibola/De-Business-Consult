import mongoose, { Document, Schema } from 'mongoose';

interface IChatMessage {
    chatId: string,
    messageId: string,
    status: string;
    message: string;
    senderId: string;
    fileUrl: string;
    fileName: string;
};

const chatMessageSchema = new Schema<IChatMessage>({
    messageId: { type: String, unique: true },
    chatId: { type: String },
    status: { type: String },
    message: { type: String },
    senderId: { type: String },
    fileUrl: { type: String },
    fileName: { type: String }
},{timestamps: true});

export interface IChatMessageModel extends Document, IChatMessage {}

const ChatMessage = mongoose.model<IChatMessageModel>('ChatMessage', chatMessageSchema as any);

export default ChatMessage;