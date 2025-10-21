import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { Settings } from '@/models/Settings';

// GET exchange rates (public endpoint)
export async function GET() {
  try {
    await dbConnect();

    const settings = await Settings.findOne();
    
    const exchangeRates = settings?.exchangeRates || {
      ETH: 2500,
      WETH: 2500,
    };

    return NextResponse.json({ exchangeRates });
  } catch (error: unknown) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
