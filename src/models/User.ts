import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
  role: 'admin' | 'user';
  password: string;
  balances: {
    WETH: number;
    ETH: number;
  };
  isEmailVerified: boolean;
  newsletterSubscribed: boolean;
  verificationToken?: string | null;
  verificationTokenExpiry?: number | null;
  resetToken?: string | null;
  resetTokenExpiry?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  avatar: { type: String },
  bio: { type: String },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  password: { type: String, required: true },
  balances: {
    WETH: { type: Number, default: 0 },
    ETH: { type: Number, default: 0 },
  },
  isEmailVerified: { type: Boolean, default: false },
  newsletterSubscribed: { type: Boolean, default: true }, // All users subscribed by default
  verificationToken: { type: String, default: null },
  verificationTokenExpiry: { type: Number, default: null },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Number, default: null },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
