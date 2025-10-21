import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { Settings } from '@/models/Settings';
import { verifyToken } from '@/utils/auth';
import { User } from '@/models/User';

// GET settings
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const settings = await Settings.findOne();
    
    // If no settings exist, create default
    if (!settings) {
      const defaultSettings = await Settings.create({
        depositAddress: '0xd9b71084a5f32e00e5e00399e80bc2c3c5383',
        networks: [
          {
            name: 'WETH',
            enabled: true,
            minDeposit: 0.00000001,
            minWithdrawal: 0.02,
            depositConfirmations: 12,
            withdrawalConfirmations: 56,
          },
          {
            name: 'ETH',
            enabled: true,
            minDeposit: 0.00000001,
            minWithdrawal: 0.02,
            depositConfirmations: 12,
            withdrawalConfirmations: 56,
          },
        ],
        depositInstructions: 'Only send ETH (ERC20) to this address',
        withdrawalInstructions: 'Withdrawal might take up to 30 minutes to be completely processed',
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error: unknown) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT update settings (admin only)
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

    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { depositAddress, networks, depositInstructions, withdrawalInstructions } = body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        depositAddress,
        networks,
        depositInstructions,
        withdrawalInstructions,
      });
    } else {
      settings.depositAddress = depositAddress;
      settings.networks = networks;
      settings.depositInstructions = depositInstructions;
      settings.withdrawalInstructions = withdrawalInstructions;
      await settings.save();
    }

    return NextResponse.json(settings);
  } catch (error: unknown) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
