import mongoose, { Document, Schema } from 'mongoose';

interface IUserToken {
    userId: string,
    refreshToken: string,
    expired_at: Date
}

const userTokenSchema = new Schema<IUserToken>({
   userId: { type: String },
   refreshToken: { type: String },
   expired_at: { type: Date }
});

export interface IUserTokenModel extends Document, IUserToken {}

const UserToken: any = mongoose.model<IUserTokenModel>('UserToken', userTokenSchema as any);

export default UserToken;