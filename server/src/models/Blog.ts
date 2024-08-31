import mongoose, { Document, Schema } from 'mongoose';

export enum BlogStatus {
    Draft = 'draft',
    Published = 'published',
    Archived = 'archived'
}

interface IBlog {
    title: string,
    content: string,
    views: number,
    comments: mongoose.Types.ObjectId[];
    likes: number;
    titleImage: string;
    bodyImages: string[];
    author: mongoose.Types.ObjectId;
    urlSlug: string;
    status: BlogStatus;
    category: mongoose.Types.ObjectId,
}

const blogSchema = new Schema<IBlog>({
    title: { type: String },
    content: { type: String },
    views: { type: Number, default: 0 },
    comments: [{ type: Schema.Types.ObjectId, ref: 'BlogComments' }],
    likes: { type: Number, default: 0 },
    titleImage: { type: String },
    bodyImages: [{ type: String }],
    author: { type: Schema.Types.ObjectId, ref: 'Author' },
    urlSlug: { type: String },
    status: {
        type: String,
        enum: Object.values(BlogStatus)
    },
    category: { type: Schema.Types.ObjectId, ref: 'BlogCategory' },
}, { timestamps: true });

blogSchema.pre(['findOne', 'find'], function (next) {
    this.populate('author')
        .populate('category')
    next();
});

export interface IBlogModel extends Document, IBlog {}

const Blog = mongoose.model<IBlogModel>('Blog', blogSchema as any);

export default Blog;