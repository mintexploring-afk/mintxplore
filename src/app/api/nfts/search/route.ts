import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { NFT } from '@/models/NFT';

// GET search NFTs with filters, sort, and pagination
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category');
    const sortBy = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      status: 'approved',
      isActive: true
    };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    if (categoryId) {
      filter.category = categoryId;
    }

    if (minPrice || maxPrice) {
      filter.floorPrice = {};
      if (minPrice) filter.floorPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.floorPrice.$lte = parseFloat(maxPrice);
    }

    // Build sort
    let sort: Record<string, 1 | -1> = {};
    switch (sortBy) {
      case 'price-asc':
        sort = { floorPrice: 1 };
        break;
      case 'price-desc':
        sort = { floorPrice: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    // Get total count for pagination
    const total = await NFT.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get NFTs
    const nfts = await NFT.find(filter)
      .populate('owner', 'name email')
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      nfts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error: unknown) {
    console.error('Error searching NFTs:', error);
    return NextResponse.json(
      { error: 'Failed to search NFTs' },
      { status: 500 }
    );
  }
}
