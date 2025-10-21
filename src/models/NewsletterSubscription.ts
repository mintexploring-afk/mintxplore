import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INewsletterSubscription extends Document {
  email: string;
  userId?: mongoose.Types.ObjectId;
  name?: string;
  status: 'active' | 'inactive';
  subscribedAt: Date;
  unsubscribedAt?: Date;
  lastEmailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSubscriptionSchema: Schema<INewsletterSubscription> = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    default: null,
  },
  name: { 
    type: String,
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active',
  },
  subscribedAt: { 
    type: Date, 
    default: Date.now,
  },
  unsubscribedAt: { 
    type: Date,
    default: null,
  },
  lastEmailSentAt: { 
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Create index for faster lookups
NewsletterSubscriptionSchema.index({ email: 1 });
NewsletterSubscriptionSchema.index({ status: 1 });
NewsletterSubscriptionSchema.index({ userId: 1 });

export const NewsletterSubscription: Model<INewsletterSubscription> = 
  mongoose.models.NewsletterSubscription || 
  mongoose.model<INewsletterSubscription>('NewsletterSubscription', NewsletterSubscriptionSchema);
