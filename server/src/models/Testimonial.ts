import mongoose, { Document, Schema } from 'mongoose';

interface ITestimonial {
    firstName: string,
    lastName: string,
    content: string
}

const testimonialSchema = new Schema<ITestimonial>({
    firstName: { type: String },
    lastName: { type: String },
    content: { type: String }
},{ timestamps: true});

export interface ITestimonialModel extends Document, ITestimonial {}

const Testimonial: any = mongoose.model<ITestimonialModel>('Testimonial', testimonialSchema as any);

export default Testimonial;