import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { Deposit } from '@/models/Deposit';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { verifyToken } from '@/utils/auth';
import { sendMail } from '@/utils/sendMail';
import { Types } from 'mongoose';

// GET all deposits (admin only)
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

    const admin = await User.findById(decoded.userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status');

    // Build query
    const query: Record<string, unknown> = {};
    
    if (status) {
      query.status = status;
    }

    if (search) {
      // Search in user name or email
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      const searchConditions: Record<string, unknown>[] = [
        { user: { $in: userIds } }
      ];

      // If search is a number, also search by amount
      const numericSearch = parseFloat(search);
      if (!isNaN(numericSearch)) {
        searchConditions.push({ amount: numericSearch });
      }

      query.$or = searchConditions;
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

// PUT update deposit status (approve/decline)
export async function PUT(req: NextRequest) {
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

    const admin = await User.findById(decoded.userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { depositId, status, adminNote } = body;

    if (!depositId || !status || !['approved', 'declined'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid depositId and status (approved/declined) are required' },
        { status: 400 }
      );
    }

    const deposit = await Deposit.findById(depositId).populate('user');
    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    if (deposit.status !== 'pending') {
      return NextResponse.json(
        { error: 'Deposit has already been processed' },
        { status: 400 }
      );
    }

    deposit.status = status;
    deposit.adminNote = adminNote;
    deposit.processedBy = decoded.userId as unknown as Types.ObjectId;
    deposit.processedAt = new Date();
    await deposit.save();

    const depositUser = await User.findById(deposit.user);
    if (!depositUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = depositUser;

    // If approved, update user balance and log transaction
    if (status === 'approved') {
      // Update the specific network balance
      const networkKey = deposit.network as 'WETH' | 'ETH';
      if (!user.balances) {
        user.balances = { WETH: 0, ETH: 0 };
      }
      user.balances[networkKey] = (user.balances[networkKey] || 0) + deposit.amount;
      
      // Mark the nested object as modified for Mongoose
      user.markModified('balances');
      await user.save();

      console.log(`✅ Deposit approved: Updated ${user.email} ${networkKey} balance to ${user.balances[networkKey]}`);

      // Log transaction
      await Transaction.create({
        user: user._id,
        type: 'deposit',
        amount: deposit.amount,
        network: deposit.network,
        status: 'completed',
        reference: deposit._id,
        referenceModel: 'Deposit',
        description: `Deposit approved: ${deposit.amount} ${deposit.network}`,
      });

      // Send approval email
      await sendMail({
        to: user.email,
        subject: 'Deposit Approved',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Deposit Approved ✓</h2>
          <p>Hi ${user.name},</p>
          <p>Your deposit has been approved and your account has been credited.</p>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${deposit.amount} ${deposit.network}</p>
            <p style="margin: 5px 0;"><strong>New ${deposit.network} Balance:</strong> ${user.balances[networkKey]} ${deposit.network}</p>
            ${adminNote ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${adminNote}</p>` : ''}
          </div>
        </div>
        `,
      });
    } else {
      // Send decline email
      await sendMail({
        to: user.email,
        subject: 'Deposit Declined',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #EF4444;">Deposit Declined</h2>
          <p>Hi ${user.name},</p>
          <p>Your deposit request has been declined.</p>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${deposit.amount} ${deposit.network}</p>
            ${adminNote ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${adminNote}</p>` : ''}
          </div>
          <p>If you have any questions, please contact support.</p>
        </div>
        `,
      });
    }

    return NextResponse.json(deposit);
  } catch (error: unknown) {
    console.error('Error updating deposit:', error);
    return NextResponse.json(
      { error: 'Failed to update deposit' },
      { status: 500 }
    );
  }
}
