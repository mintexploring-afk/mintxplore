import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ITransaction extends Document {
  user: Types.ObjectId;
  type: 'deposit' | 'withdrawal' | 'nft-purchase' | 'nft-sale';
  amount: number;
  currency?: string;
  network?: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: Types.ObjectId; // Reference to Deposit or Withdrawal
  referenceModel?: 'Deposit' | 'Withdrawal';
  description?: string;
  note?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'nft-purchase', 'nft-sale'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'WETH' },
  network: { type: String },
  status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
  reference: { type: Schema.Types.ObjectId },
  referenceModel: { type: String, enum: ['Deposit', 'Withdrawal'] },
  description: { type: String },
  note: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, {
  timestamps: true,
});

export const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
