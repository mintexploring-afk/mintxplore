import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { Category } from '@/models/Category';

// GET all active categories (public)
export async function GET() {
  try {
    await dbConnect();

    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    return NextResponse.json({ categories });
  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
