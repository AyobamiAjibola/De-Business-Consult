import mongoose, { Document, Schema } from 'mongoose';

export enum UserType {
    Blog = 'blog',
    Application = 'application',
    Appointment = 'appointment',
    SuperAdmin = 'super-admin',
    Newsletter = 'newsletter',
    UsersAndClient = 'users_and_clients',
    Testimonial = 'testimonial',
    Payments = 'payments',
    Services = 'services',
    Dashboard = 'dashboard',
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
    status: boolean;
    email: string;
    password: string,
    passwordReset: {
        exp: number,
        code: string
    },
    userType: UserType[];
    calendly: {
        uid: string;
        accessToken: string;
        // refreshToken: string;
    }
};

const userSchema = new Schema<IUser>({
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    image: { type: String },
    status: { 
        type: Boolean, 
        enum: Object.values(UserStatus), 
        default: true
    },
    email: { type: String },
    password: { type: String },
    passwordReset: {
        exp: { type: Date, allowNull: true },
        code: { type: String },
    },
    userType: [{ type: String, enum: Object.values(UserType) }],
    calendly: {
        uid: { type: String },
        accessToken: { type: String },
        // refreshToken: { type: String }
    }

}, { timestamps: true });
  
export interface IUserModel extends Document, IUser {}
  
const User = mongoose.model<IUserModel>('User', userSchema as any);

export default User