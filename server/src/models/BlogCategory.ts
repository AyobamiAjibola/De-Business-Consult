import mongoose, { Document, Schema } from 'mongoose';

interface IBlogCategory {
    name: string
}

const blogCategorySchema = new Schema<IBlogCategory>({
    name: { type: String }
});

export interface IBlogCategoryModel extends Document, IBlogCategory {}

const BlogCategory: any = mongoose.model<IBlogCategoryModel>('BlogCategory', blogCategorySchema as any);

export default BlogCategory;