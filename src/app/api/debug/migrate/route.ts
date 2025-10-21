import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { User } from '@/models/User';
import crypto from 'crypto';

// Migration endpoint to add verification fields to existing users
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Find all users without email verification fields
    const users = await User.find({
      $or: [
        { isEmailVerified: { $exists: false } },
        { verificationToken: { $exists: false } },
        { verificationTokenExpiry: { $exists: false } }
      ]
    });
    
    console.log(`Found ${users.length} users to migrate`);
    
    const updates = [];
    
    for (const user of users) {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      
      user.isEmailVerified = false;
      user.verificationToken = verificationToken;
      user.verificationTokenExpiry = verificationTokenExpiry;
      
      await user.save();
      
      updates.push({
        email: user.email,
        token: verificationToken
      });
      
      console.log(`Migrated user: ${user.email}`);
    }
    
    return NextResponse.json({
      message: `Successfully migrated ${users.length} users`,
      users: updates
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get all users verification status
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const users = await User.find({}).select('email name isEmailVerified verificationToken verificationTokenExpiry');
    
    const userInfo = users.map(user => ({
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
      hasToken: !!user.verificationToken,
      tokenPreview: user.verificationToken ? user.verificationToken.substring(0, 10) + '...' : null,
      expiry: user.verificationTokenExpiry,
      isExpired: user.verificationTokenExpiry ? user.verificationTokenExpiry < Date.now() : null
    }));
    
    return NextResponse.json({
      count: users.length,
      users: userInfo
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
