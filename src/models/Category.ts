import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  coverImage?: string;
  minFloorPrice: number;
  mintFee: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  coverImage: { type: String },
  minFloorPrice: { type: Number, required: true, default: 0 },
  mintFee: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
