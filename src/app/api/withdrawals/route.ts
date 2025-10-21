import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { Withdrawal } from '@/models/Withdrawal';
import { User } from '@/models/User';
import { Settings } from '@/models/Settings';
import { verifyToken } from '@/utils/auth';
import { sendMail } from '@/utils/sendMail';

// GET user's withdrawals
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Build query
    const query: Record<string, unknown> = { user: decoded.userId };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { network: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } },
        { adminNote: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const totalItems = await Withdrawal.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const withdrawals = await Withdrawal.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('user', 'name email')
      .populate('processedBy', 'name email');

    return NextResponse.json({
      withdrawals,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

// POST create new withdrawal request
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, network, type, destination, destinationType, note } = body;

    if (!amount || !network || !type || !destination) {
      return NextResponse.json(
        { error: 'Amount, network, type, and destination are required' },
        { status: 400 }
      );
    }

    // Get settings to check minimum withdrawal
    const settings = await Settings.findOne();
    const networkSettings = settings?.networks.find((n) => n.name === network);
    const minWithdrawal = networkSettings?.minWithdrawal || 0.02;

    if (amount < minWithdrawal) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is ${minWithdrawal}` },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has sufficient balance for the specific network
    const networkKey = network as 'WETH' | 'ETH';
    const networkBalance = user.balances?.[networkKey] || 0;
    
    if (networkBalance < amount) {
      return NextResponse.json(
        { error: `Insufficient ${network} balance. Available: ${networkBalance}` },
        { status: 400 }
      );
    }

    const withdrawal = await Withdrawal.create({
      user: decoded.userId,
      amount,
      network,
      type,
      destination,
      destinationType: destinationType || 'address',
      note,
      status: 'pending',
    });

    // Send email notification to admin
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await sendMail({
        to: admin.email,
        subject: 'New Withdrawal Request',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Withdrawal Request</h2>
          <p><strong>${user.name}</strong> (${user.email}) has submitted a withdrawal request.</p>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Type:</strong> ${type}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount} ${network}</p>
            <p style="margin: 5px 0;"><strong>Network:</strong> ${network}</p>
            <p style="margin: 5px 0;"><strong>Destination:</strong> ${destination}</p>
            ${note ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${note}</p>` : ''}
          </div>
          <a href="${appUrl}/admin/withdrawals" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Review Withdrawal
          </a>
        </div>
        `,
      });
    }

    return NextResponse.json(withdrawal, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to create withdrawal' },
      { status: 500 }
    );
  }
}
