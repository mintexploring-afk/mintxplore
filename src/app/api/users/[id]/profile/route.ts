import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { User } from '@/models/User';
import { NFT } from '@/models/NFT';

// GET user public profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const user = await User.findById(id).select('name email avatar bio createdAt');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's active NFTs
    const nfts = await NFT.find({
      owner: id,
      status: 'approved',
      isActive: true
    })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    // Mask email for privacy
    const emailParts = user.email.split('@');
    const maskedEmail = emailParts[0].charAt(0) + '***@' + emailParts[1];

    // Mask name - show first name and first letter of last name
    const nameParts = user.name.split(' ');
    const maskedName = nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.`
      : nameParts[0];

    return NextResponse.json({
      user: {
        _id: user._id,
        name: maskedName,
        email: maskedEmail,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
        nftCount: nfts.length
      },
      nfts
    });
  } catch (error: unknown) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
