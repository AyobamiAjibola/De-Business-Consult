import mongoose, { Document, Schema } from 'mongoose';

interface IAuthor {
    name: string,
    jobTitle: string,
    image: string
}

const authorSchema = new Schema<IAuthor>({
    name: { type: String },
    jobTitle: { type: String },
    image: { type: String }
});

export interface IAuthorModel extends Document, IAuthor {}

const Author: any = mongoose.model<IAuthorModel>('Author', authorSchema as any);

export default Author;