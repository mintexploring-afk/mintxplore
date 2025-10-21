import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  depositAddress: string;
  networks: {
    name: string;
    enabled: boolean;
    minDeposit: number;
    minWithdrawal: number;
    depositConfirmations: number;
    withdrawalConfirmations: number;
  }[];
  depositInstructions?: string;
  withdrawalInstructions?: string;
  exchangeRates?: {
    ETH: number;
    WETH: number;
    ETH_TO_WETH: number; // Conversion rate: 1 ETH = X WETH
  };
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema<ISettings> = new Schema({
  depositAddress: { type: String, required: true },
  networks: [{
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    minDeposit: { type: Number, default: 0.00000001 },
    minWithdrawal: { type: Number, default: 0.02 },
    depositConfirmations: { type: Number, default: 12 },
    withdrawalConfirmations: { type: Number, default: 56 },
  }],
  depositInstructions: { type: String },
  withdrawalInstructions: { type: String },
  exchangeRates: {
    ETH: { type: Number, default: 2500 }, // Default ETH to USDT rate
    WETH: { type: Number, default: 2500 }, // Default WETH to USDT rate
    ETH_TO_WETH: { type: Number, default: 1 }, // Default 1 ETH = 1 WETH
  },
}, {
  timestamps: true,
});

export const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
