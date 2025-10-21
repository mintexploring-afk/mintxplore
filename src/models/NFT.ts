import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface INFT extends Document {
  owner: Types.ObjectId;
  name: string;
  description?: string;
  category: Types.ObjectId;
  floorPrice: number;
  artworkUrl: string;
  status: 'pending' | 'approved' | 'declined';
  isActive: boolean;
  mintFee: number;
  adminNote?: string;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NFTSchema: Schema<INFT> = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  floorPrice: { type: Number, required: true },
  artworkUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  isActive: { type: Boolean, default: false },
  mintFee: { type: Number, required: true },
  adminNote: { type: String },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
}, {
  timestamps: true,
});

export const NFT: Model<INFT> = mongoose.models.NFT || mongoose.model<INFT>('NFT', NFTSchema);
