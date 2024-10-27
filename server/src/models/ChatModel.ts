import mongoose, { Document, Schema } from 'mongoose';

interface IChat {
    members: string[],
    files: string[],
}

const chatSchema = new Schema<IChat>({
    members: [{ type: String }],
    files: [{ type: String }]
},{ timestamps: true });

export interface IChatModel extends Document, IChat {}

const Chat = mongoose.model<IChatModel>('Chat', chatSchema as any);

export default Chat;