import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { User } from '@/models/User';
import { Deposit } from '@/models/Deposit';
import { Withdrawal } from '@/models/Withdrawal';
import { verifyToken } from '@/utils/auth';

// GET platform statistics (admin only)
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

    // Get all deposits
    const deposits = await Deposit.find();
    const approvedDeposits = deposits.filter(d => d.status === 'approved');
    const pendingDeposits = deposits.filter(d => d.status === 'pending');

    // Get all withdrawals
    const withdrawals = await Withdrawal.find();
    const approvedWithdrawals = withdrawals.filter(w => w.status === 'approved');
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

    // Get all users
    const users = await User.find();
    const totalUsers = users.length;

    // Calculate total balances
    const totalBalances = users.reduce(
      (acc, user) => {
        acc.WETH += user.balances?.WETH || 0;
        acc.ETH += user.balances?.ETH || 0;
        return acc;
      },
      { WETH: 0, ETH: 0 }
    );

    // Calculate today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const depositsToday = deposits.filter(
      d => new Date(d.createdAt) >= today
    ).length;

    const withdrawalsToday = withdrawals.filter(
      w => new Date(w.createdAt) >= today
    ).length;

    // Calculate total amounts
    const totalDepositAmount = approvedDeposits.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    const totalWithdrawalAmount = approvedWithdrawals.reduce(
      (sum, w) => sum + w.amount,
      0
    );

    const stats = {
      totalDeposits: {
        count: deposits.length,
        amount: totalDepositAmount,
        pending: pendingDeposits.length,
      },
      totalWithdrawals: {
        count: withdrawals.length,
        amount: totalWithdrawalAmount,
        pending: pendingWithdrawals.length,
      },
      totalUsers,
      totalBalances,
      recentActivity: {
        depositsToday,
        withdrawalsToday,
      },
    };

    return NextResponse.json(stats);
  } catch (error: unknown) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
