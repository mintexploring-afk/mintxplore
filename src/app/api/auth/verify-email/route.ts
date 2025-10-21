import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { User } from '@/models/User';
import crypto from 'crypto';
import { sendMail } from '@/utils/sendMail';
import { getWelcomeEmailTemplate } from '@/utils/emailTemplates';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    console.log('Verification attempt with token:', token);
    
    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }
    
    await dbConnect();
    
    // First check if any user has this token (without expiry check)
    const userWithToken = await User.findOne({ verificationToken: token });
    console.log('User with token found:', userWithToken ? 'Yes' : 'No');
    
    if (userWithToken) {
      console.log('Token expiry:', userWithToken.verificationTokenExpiry);
      console.log('Current time:', Date.now());
      console.log('Is expired:', userWithToken.verificationTokenExpiry ? userWithToken.verificationTokenExpiry < Date.now() : 'No expiry set');
    }
    
    // Find user with this verification token and not expired
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }, // Token not expired
    });
    
    if (!user) {
      // Check if token exists but expired
      if (userWithToken) {
        return NextResponse.json({ 
          error: 'Verification token has expired. Please request a new verification email.',
          code: 'TOKEN_EXPIRED'
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Invalid verification token. Please request a new verification email.',
        code: 'TOKEN_INVALID'
      }, { status: 400 });
    }
    
    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json({ 
        message: 'Email already verified. You can login now.',
        alreadyVerified: true
      });
    }
    
    // Update user
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();
    
    console.log('Email verified successfully for user:', user.email);
    
    return NextResponse.json({ 
      message: 'Email verified successfully! You can now login.',
      success: true
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ 
      error: 'Verification failed. Please try again.' 
    }, { status: 500 });
  }
}

// Resend verification email
export async function PUT(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    await dbConnect();
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.isEmailVerified) {
      return NextResponse.json({ 
        message: 'Email already verified. You can login now.' 
      });
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();
    
    // Send new verification email
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
    const emailHtml = getWelcomeEmailTemplate(user.name, verificationLink);
    
    await sendMail({
      to: email,
      subject: 'Verify Your Email - Opalineart',
      html: emailHtml,
    });
    
    return NextResponse.json({ 
      message: 'Verification email sent! Please check your inbox.' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ 
      error: 'Failed to resend verification email. Please try again.' 
    }, { status: 500 });
  }
}
