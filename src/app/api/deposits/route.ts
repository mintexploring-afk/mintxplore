import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { Deposit } from '@/models/Deposit';
import { User } from '@/models/User';
import { verifyToken } from '@/utils/auth';
import { sendMail } from '@/utils/sendMail';

// GET user's deposits
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

    // Build query
    const query: Record<string, unknown> = { user: decoded.userId };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { network: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } },
        { adminNote: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const totalItems = await Deposit.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const deposits = await Deposit.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('user', 'name email')
      .populate('processedBy', 'name email');

    return NextResponse.json({
      deposits,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching deposits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}

// POST create new deposit request
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
    const { amount, network, proofFiles, note } = body;

    if (!amount || !network || !proofFiles || proofFiles.length === 0) {
      return NextResponse.json(
        { error: 'Amount, network, and proof files are required' },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const deposit = await Deposit.create({
      user: decoded.userId,
      amount,
      network,
      proofFiles,
      note,
      status: 'pending',
    });

    // Send email notification to admin
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await sendMail({
        to: admin.email,
        subject: 'New Deposit Request',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Deposit Request</h2>
          <p><strong>${user.name}</strong> (${user.email}) has submitted a deposit request.</p>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount} ${network}</p>
            <p style="margin: 5px 0;"><strong>Network:</strong> ${network}</p>
            ${note ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${note}</p>` : ''}
          </div>
          <a href="${appUrl}/admin/deposits" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Review Deposit
          </a>
        </div>
        `,
      });
    }

    return NextResponse.json(deposit, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating deposit:', error);
    return NextResponse.json(
      { error: 'Failed to create deposit' },
      { status: 500 }
    );
  }
}
