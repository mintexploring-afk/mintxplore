import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { User } from '@/models/User';

// Migration endpoint to add balances field to existing users
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const users = await User.find({});
    const updates = [];

    for (const user of users) {
      if (!user.balances) {
        updates.push({
          email: user.email,
          hadBalances: false,
        });
      }
    }

    return NextResponse.json({
      totalUsers: users.length,
      usersWithoutBalances: updates.length,
      users: updates,
    });
  } catch (error: unknown) {
    console.error('Error checking balances:', error);
    return NextResponse.json(
      { error: 'Failed to check balances' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const users = await User.find({});
    const updated = [];

    for (const user of users) {
      if (!user.balances) {
        user.balances = { WETH: 0, ETH: 0 };
        user.markModified('balances');
        await user.save();
        updated.push({
          email: user.email,
          balances: user.balances,
        });
      }
    }

    return NextResponse.json({
      message: `Successfully migrated ${updated.length} users`,
      users: updated,
    });
  } catch (error: unknown) {
    console.error('Error migrating balances:', error);
    return NextResponse.json(
      { error: 'Failed to migrate balances' },
      { status: 500 }
    );
  }
}
