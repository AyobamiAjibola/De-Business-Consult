import mongoose, { Document, Schema } from 'mongoose';

interface IBlogComments {
    comment: string,
    blog: mongoose.Types.ObjectId;
}

const blogCommentsSchema = new Schema<IBlogComments>({
    comment: { type: String },
    blog: { type: Schema.Types.ObjectId, ref: 'Blog' }
}, { timestamps: true });

export interface IBlogCommentsModel extends Document, IBlogComments {}

const BlogComments = mongoose.model<IBlogCommentsModel>('BlogComments', blogCommentsSchema as any);

export default BlogComments;