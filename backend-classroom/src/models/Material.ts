import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial extends Document {
  title: string;
  subject: string;
  grade: string;
  description: string;
  type: string; // 'pdf', 'doc', 'video', 'link'
  size: string; // e.g., '2.4 MB'
  fileUrl: string; // The URL to the uploaded file or external link
  uploaderId: mongoose.Types.ObjectId; // User who uploaded it
  isPublic: boolean; // Accessible to everyone
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, required: true, enum: ['pdf', 'doc', 'video', 'link'] },
    size: { type: String, default: 'Link' },
    fileUrl: { type: String, required: true },
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMaterial>('Material', MaterialSchema);
