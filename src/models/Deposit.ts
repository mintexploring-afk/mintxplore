import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IDeposit extends Document {
  user: Types.ObjectId;
  amount: number;
  network: string;
  proofFiles: string[]; // Cloudinary URLs
  note?: string;
  status: 'pending' | 'approved' | 'declined';
  adminNote?: string;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DepositSchema: Schema<IDeposit> = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  network: { type: String, required: true },
  proofFiles: [{ type: String, required: true }],
  note: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  adminNote: { type: String },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
}, {
  timestamps: true,
});

export const Deposit: Model<IDeposit> = mongoose.models.Deposit || mongoose.model<IDeposit>('Deposit', DepositSchema);
