import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { Category } from '@/models/Category';
import { NFT } from '@/models/NFT';

// GET categories with NFT counts for exhibition
export async function GET() {
  try {
    await dbConnect();

    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    // Get NFT count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const nftCount = await NFT.countDocuments({
          category: category._id,
          status: 'approved',
          isActive: true
        });

        return {
          _id: category._id,
          name: category.name,
          description: category.description,
          coverImage: category.coverImage,
          nftCount
        };
      })
    );

    return NextResponse.json({ categories: categoriesWithCount });
  } catch (error: unknown) {
    console.error('Error fetching categories with counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
