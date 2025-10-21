import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { User } from '@/models/User';

// Debug endpoint to check user verification status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }
    
    await dbConnect();
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      email: user.email,
      name: user.name,
      role: user.role,
      balances: user.balances,
      isEmailVerified: user.isEmailVerified,
      hasVerificationToken: !!user.verificationToken,
      verificationToken: user.verificationToken, // Show full token for debugging
      verificationTokenExpiry: user.verificationTokenExpiry,
      currentTime: Date.now(),
      isExpired: user.verificationTokenExpiry ? user.verificationTokenExpiry < Date.now() : null,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}
