import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/utils/dbConnect'
import { NFT } from '@/models/NFT'

// GET - Get all active NFTs (marketplace)
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const query: Record<string, string | boolean> = {
      status: 'approved',
      isActive: true
    }

    if (category) {
      query.category = category
    }

    const nfts = await NFT.find(query)
      .populate('owner', 'name email')
      .populate('category', 'name')
      .sort({ createdAt: -1 })

    return NextResponse.json({ nfts })
  } catch (error) {
    console.error('Error fetching marketplace NFTs:', error)
    return NextResponse.json(
      { message: 'Error fetching NFTs' },
      { status: 500 }
    )
  }
}
