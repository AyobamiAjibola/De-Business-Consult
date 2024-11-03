import mongoose, { Document, Schema } from 'mongoose';

interface IUserToken {
    userId: string,
    refresh_token: string,
    expired_at: Date
}

const userTokenSchema = new Schema<IUserToken>({
   userId: { type: String },
   refresh_token: { type: String },
   expired_at: { type: Date }
});

export interface IUserTokenModel extends Document, IUserToken {}

const UserToken: any = mongoose.model<IUserTokenModel>('UserToken', userTokenSchema as any);

export default UserToken;