import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { NFT } from '@/models/NFT';

// GET top NFTs grouped by category
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (categoryId) {
      // Get top NFTs for specific category
      const nfts = await NFT.find({
        category: categoryId,
        status: 'approved',
        isActive: true
      })
        .populate('owner', 'name email')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);

      return NextResponse.json({ nfts });
    }

    // Get all categories and their top NFTs
    const nfts = await NFT.find({
      status: 'approved',
      isActive: true
    })
      .populate('owner', 'name email')
      .populate('category', 'name coverImage')
      .sort({ createdAt: -1 });

    // Group by category and limit each group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groupedByCategory: Record<string, any[]> = {};
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nfts.forEach((nft: any) => {
      const categoryId = nft.category._id.toString();
      if (!groupedByCategory[categoryId]) {
        groupedByCategory[categoryId] = [];
      }
      if (groupedByCategory[categoryId].length < limit) {
        groupedByCategory[categoryId].push(nft);
      }
    });

    return NextResponse.json({ groupedNFTs: groupedByCategory });
  } catch (error: unknown) {
    console.error('Error fetching top NFTs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}
