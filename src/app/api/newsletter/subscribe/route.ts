import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { User } from '@/models/User';
import { NewsletterSubscription } from '@/models/NewsletterSubscription';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Update existing user's newsletter subscription
      user.newsletterSubscribed = true;
      await user.save();

      // Handle newsletter subscription entry
      const existingSubscription = await NewsletterSubscription.findOne({ email: email.toLowerCase() });

      if (existingSubscription) {
        existingSubscription.status = 'active';
        existingSubscription.name = user.name;
        existingSubscription.userId = user._id as unknown as import('mongoose').Types.ObjectId;
        existingSubscription.subscribedAt = new Date();
        existingSubscription.unsubscribedAt = undefined;
        await existingSubscription.save();
      } else {
        await NewsletterSubscription.create({
          email: email.toLowerCase(),
          name: user.name,
          userId: user._id as unknown as import('mongoose').Types.ObjectId,
          status: 'active',
          subscribedAt: new Date(),
        });
      }

      return NextResponse.json({
        message: 'Successfully subscribed to newsletter!'
      });
    } else {
      // For non-registered users, we could store in a separate NewsletterSubscriber collection
      // For now, we'll just return a message asking them to register
      return NextResponse.json({
        message: 'Please register an account to subscribe to our newsletter.'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { message: 'An error occurred while subscribing' },
      { status: 500 }
    );
  }
}
