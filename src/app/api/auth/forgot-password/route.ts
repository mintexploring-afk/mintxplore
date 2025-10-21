import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { User } from '@/models/User';
import { sendMail } from '@/utils/sendMail';
import { getPasswordResetEmailTemplate } from '@/utils/emailTemplates';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    await dbConnect();
    
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }
    
    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();
    
    // Send email with styled template
    try {
      const url = new URL(req.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      const emailHtml = getPasswordResetEmailTemplate(user.name, resetUrl);
      
      await sendMail({
        to: user.email,
        subject: 'Reset Your Password - Opalineart',
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send reset email. Please try again.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'If an account exists with this email, a password reset link has been sent. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request. Please try again.' 
    }, { status: 500 });
  }
}
