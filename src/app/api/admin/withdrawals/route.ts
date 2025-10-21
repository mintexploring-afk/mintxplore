import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { Withdrawal } from '@/models/Withdrawal';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { verifyToken } from '@/utils/auth';
import { sendMail } from '@/utils/sendMail';
import { Types } from 'mongoose';

// GET all withdrawals (admin only)
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
      // Search in user name, email, or destination
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      const searchConditions: Record<string, unknown>[] = [
        { user: { $in: userIds } },
        { destination: { $regex: search, $options: 'i' } }
      ];

      // If search is a number, also search by amount
      const numericSearch = parseFloat(search);
      if (!isNaN(numericSearch)) {
        searchConditions.push({ amount: numericSearch });
      }

      query.$or = searchConditions;
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
      .populate('user', 'name email balances')
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

// PUT update withdrawal status (approve/decline)
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
    const { withdrawalId, status, adminNote } = body;

    if (!withdrawalId || !status || !['approved', 'declined'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid withdrawalId and status (approved/declined) are required' },
        { status: 400 }
      );
    }

    const withdrawal = await Withdrawal.findById(withdrawalId).populate('user');
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Withdrawal has already been processed' },
        { status: 400 }
      );
    }

    withdrawal.status = status;
    withdrawal.adminNote = adminNote;
    withdrawal.processedBy = decoded.userId as unknown as Types.ObjectId;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    const withdrawalUser = await User.findById(withdrawal.user);
    if (!withdrawalUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = withdrawalUser;

    // If approved, deduct balance and log transaction
    if (status === 'approved') {
      // Update the specific network balance
      const networkKey = withdrawal.network as 'WETH' | 'ETH';
      if (!user.balances) {
        user.balances = { WETH: 0, ETH: 0 };
      }
      user.balances[networkKey] = (user.balances[networkKey] || 0) - withdrawal.amount;
      
      // Mark the nested object as modified for Mongoose
      user.markModified('balances');
      await user.save();

      console.log(`✅ Withdrawal approved: Updated ${user.email} ${networkKey} balance to ${user.balances[networkKey]}`);

      // Log transaction for sender
      await Transaction.create({
        user: user._id,
        type: 'withdrawal',
        amount: -withdrawal.amount, // Negative for withdrawal
        network: withdrawal.network,
        status: 'completed',
        reference: withdrawal._id,
        referenceModel: 'Withdrawal',
        description: `Withdrawal approved: ${withdrawal.amount} ${withdrawal.network} (${withdrawal.type})`,
      });

      // For internal transfers, credit the recipient's balance
      if (withdrawal.type === 'internal') {
        const recipient = await User.findOne({ email: withdrawal.destination });
        if (recipient) {
          if (!recipient.balances) {
            recipient.balances = { WETH: 0, ETH: 0 };
          }
          recipient.balances[networkKey] = (recipient.balances[networkKey] || 0) + withdrawal.amount;
          
          // Mark the nested object as modified for Mongoose
          recipient.markModified('balances');
          await recipient.save();

          console.log(`✅ Internal transfer: Credited ${recipient.email} ${networkKey} balance to ${recipient.balances[networkKey]}`);

          // Log transaction for recipient
          await Transaction.create({
            user: recipient._id,
            type: 'deposit',
            amount: withdrawal.amount, // Positive for deposit
            network: withdrawal.network,
            status: 'completed',
            reference: withdrawal._id,
            referenceModel: 'Withdrawal',
            description: `Internal transfer received from ${user.email}: ${withdrawal.amount} ${withdrawal.network}`,
          });

          // Send notification email to recipient
          await sendMail({
            to: recipient.email,
            subject: 'You Received a Transfer',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10B981;">Transfer Received ✓</h2>
              <p>Hi ${recipient.name},</p>
              <p>You have received a transfer from <strong>${user.name}</strong>.</p>
              <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Amount:</strong> ${withdrawal.amount} ${withdrawal.network}</p>
                <p style="margin: 5px 0;"><strong>From:</strong> ${user.email}</p>
                <p style="margin: 5px 0;"><strong>New ${withdrawal.network} Balance:</strong> ${recipient.balances[networkKey]} ${withdrawal.network}</p>
                ${withdrawal.note ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${withdrawal.note}</p>` : ''}
              </div>
            </div>
            `,
          });
        } else {
          console.error(`⚠️ Internal transfer recipient not found: ${withdrawal.destination}`);
        }
      }

      // Send approval email
      await sendMail({
        to: user.email,
        subject: 'Withdrawal Approved',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Withdrawal Approved ✓</h2>
          <p>Hi ${user.name},</p>
          <p>Your withdrawal has been approved and processed.</p>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Type:</strong> ${withdrawal.type}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${withdrawal.amount} ${withdrawal.network}</p>
            <p style="margin: 5px 0;"><strong>Destination:</strong> ${withdrawal.destination}</p>
            <p style="margin: 5px 0;"><strong>New ${withdrawal.network} Balance:</strong> ${user.balances[networkKey]} ${withdrawal.network}</p>
            ${adminNote ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${adminNote}</p>` : ''}
          </div>
          ${withdrawal.type === 'on-chain' ? '<p style="color: #F59E0B;">⚠️ Withdrawal might take up to 30 minutes to be completely processed</p>' : ''}
        </div>
        `,
      });
    } else {
      // Send decline email
      await sendMail({
        to: user.email,
        subject: 'Withdrawal Declined',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #EF4444;">Withdrawal Declined</h2>
          <p>Hi ${user.name},</p>
          <p>Your withdrawal request has been declined.</p>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${withdrawal.amount} ${withdrawal.network}</p>
            <p style="margin: 5px 0;"><strong>Destination:</strong> ${withdrawal.destination}</p>
            ${adminNote ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${adminNote}</p>` : ''}
          </div>
          <p>Your balance remains unchanged. If you have any questions, please contact support.</p>
        </div>
        `,
      });
    }

    return NextResponse.json(withdrawal);
  } catch (error: unknown) {
    console.error('Error updating withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal' },
      { status: 500 }
    );
  }
}
