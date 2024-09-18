import mongoose, { Document, Schema } from 'mongoose';

export enum UserType {
    Admin = 'admin',
    User = 'user',
    Guest = 'guest',
    SuperAdmin = 'super-admin'
}

export enum UserStatus {
    Active = 'active',
    Inactive = 'inactive'
}

interface IUser {
    firstName: string;
    lastName: string;
    phone: string;
    image: string;
    status: UserStatus;
    email: string;
    password: string,
    passwordReset: {
        exp: number,
        code: string
    },
    userType: UserType[];
};

const userSchema = new Schema<IUser>({
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    image: { type: String },
    status: { 
        type: String, 
        enum: Object.values(UserStatus), 
        default: UserStatus.Active 
    },
    email: { type: String },
    password: { type: String },
    passwordReset: {
        exp: { type: Date, allowNull: true },
        code: { type: String },
    },
    userType: [{ type: String, enum: Object.values(UserType) }]
}, { timestamps: true });
  
export interface IUserModel extends Document, IUser {}
  
const User = mongoose.model<IUserModel>('User', userSchema as any);

export default User