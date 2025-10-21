import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWithdrawal extends Document {
  user: Types.ObjectId;
  amount: number;
  network: string;
  type: 'on-chain' | 'internal';
  destination: string; // wallet address or email
  destinationType?: 'address' | 'email'; // for internal transfers
  note?: string;
  status: 'pending' | 'approved' | 'declined';
  adminNote?: string;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalSchema: Schema<IWithdrawal> = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  network: { type: String, required: true },
  type: { type: String, enum: ['on-chain', 'internal'], required: true },
  destination: { type: String, required: true },
  destinationType: { type: String, enum: ['address', 'email'] },
  note: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  adminNote: { type: String },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
}, {
  timestamps: true,
});

export const Withdrawal: Model<IWithdrawal> = mongoose.models.Withdrawal || mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);
