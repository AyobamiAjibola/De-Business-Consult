import mongoose, { Document, Schema } from 'mongoose';

interface IChat {
    members: string[]
}

const chatSchema = new Schema<IChat>({
    members: [{ type: String }]
},{ timestamps: true });

export interface IChatModel extends Document, IChat {}

const Chat = mongoose.model<IChatModel>('Chat', chatSchema as any);

export default Chat;