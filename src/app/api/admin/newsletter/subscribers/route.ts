import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { NewsletterSubscription } from '@/models/NewsletterSubscription';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'subscribedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build query
    interface QueryType {
      $or?: Array<Record<string, { $regex: string; $options: string }>>;
    }

    const query: QueryType = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await NewsletterSubscription.countDocuments(query);

    // Get paginated subscribers
    const subscribers = await NewsletterSubscription.find(query)
      .select('name email status subscribedAt unsubscribedAt')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    interface SubscriberDoc {
      _id: unknown;
      name?: string;
      email: string;
      status: string;
      subscribedAt?: Date;
      unsubscribedAt?: Date;
    }

    // Format data
    const formattedSubscribers = subscribers.map((sub: SubscriberDoc) => ({
      _id: String(sub._id),
      name: sub.name || 'N/A',
      email: sub.email,
      status: sub.status,
      subscribedDate: sub.subscribedAt || new Date(),
      unsubscribedDate: sub.unsubscribedAt,
    }));

    return NextResponse.json({
      subscribers: formattedSubscribers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}

// PUT - Toggle subscription status
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, status } = body;

    if (!email || !status) {
      return NextResponse.json(
        { error: 'Email and status are required' },
        { status: 400 }
      );
    }

    if (status !== 'active' && status !== 'inactive') {
      return NextResponse.json(
        { error: 'Status must be either "active" or "inactive"' },
        { status: 400 }
      );
    }

    const subscription = await NewsletterSubscription.findOne({ email: email.toLowerCase() });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    subscription.status = status;
    if (status === 'inactive') {
      subscription.unsubscribedAt = new Date();
    } else {
      subscription.subscribedAt = new Date();
      subscription.unsubscribedAt = undefined;
    }

    await subscription.save();

    return NextResponse.json({
      message: 'Subscription status updated successfully',
      subscription: {
        email: subscription.email,
        status: subscription.status,
      }
    });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription status' },
      { status: 500 }
    );
  }
}
