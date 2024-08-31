import mongoose, { Document, Schema } from 'mongoose';

interface IDeBizDocs {
    termsAndCondition: {
        content: string,
        dateUpdated: Date
    };
    aboutUs: string;
    contactUs: string;
    socialMedia: {
        fb: string,
        x: string,
        youtube: string,
        linkedIn: string,
        ig: string,
        dribble: string
    }
};

const deBizDocsSchema = new Schema<IDeBizDocs>({
    termsAndCondition: { 
        content: { type: String },
        dateUpdated: { type: Date }
    },
    aboutUs: { type: String },
    contactUs: { type: String },
    socialMedia: {
        fb: { type: String },
        x: { type: String },
        youtube: { type: String },
        linkedIn: { type: String },
        ig: { type: String },
        dribble: { type: String }
    }
}, { timestamps: true });
  
export interface IDeBizDocsModel extends Document, IDeBizDocs {}
  
const DeBizDocs: any = mongoose.model<IDeBizDocsModel>('DeBizDocs', deBizDocsSchema as any);

export default DeBizDocs