import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { NFT } from '@/models/NFT';
import { User } from '@/models/User';
import { verifyToken } from '@/utils/auth';

// PUT - Toggle NFT active status (admin only)
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

    const { id, isActive } = await req.json();

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'NFT ID and isActive status are required' }, { status: 400 });
    }

    const nft = await NFT.findById(id);

    if (!nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
    }

    // Only allow toggling active status for approved NFTs
    if (nft.status !== 'approved') {
      return NextResponse.json(
        { error: 'Can only toggle active status for approved NFTs' },
        { status: 400 }
      );
    }

    nft.isActive = isActive;
    await nft.save();

    return NextResponse.json({
      message: `NFT ${isActive ? 'activated' : 'deactivated'} successfully`,
      nft
    });
  } catch (error: unknown) {
    console.error('Error toggling NFT active status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle NFT active status' },
      { status: 500 }
    );
  }
}
