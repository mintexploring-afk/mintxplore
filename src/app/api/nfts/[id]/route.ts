import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { NFT } from '@/models/NFT';

// GET single NFT by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const nft = await NFT.findById(id)
      .populate('owner', 'name email avatar')
      .populate('category', 'name description');

    if (!nft) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      );
    }

    if (nft.status !== 'approved' || !nft.isActive) {
      return NextResponse.json(
        { error: 'NFT not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({ nft });
  } catch (error: unknown) {
    console.error('Error fetching NFT:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT' },
      { status: 500 }
    );
  }
}
