import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { User } from '@/models/User';
import { NewsletterSubscription } from '@/models/NewsletterSubscription';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendMail } from '@/utils/sendMail';
import { getWelcomeEmailTemplate } from '@/utils/emailTemplates';

export async function POST(req: NextRequest) {
  try {
    const { name, email, username, password, avatar, role } = await req.json();
    
    // Validate required fields
    if (!name || !email || !username || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await dbConnect();
    
    // Check if user already exists
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      if (existing.email === email) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      }
      if (existing.username === username) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }
    
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    console.log('Generated verification token:', verificationToken);
    console.log('Token expiry:', verificationTokenExpiry);
    console.log('Current time:', Date.now());
    
    // Create user
    const user = await User.create({
      name,
      email,
      username,
      avatar,
      role: role || 'user',
      password: hashed,
      isEmailVerified: false,
      verificationToken,
      verificationTokenExpiry,
      newsletterSubscribed: true, // All users subscribed by default
    });
    
    console.log('User created with verification token');

    // Create newsletter subscription entry
    try {
      await NewsletterSubscription.create({
        email: email.toLowerCase(),
        name,
        userId: user._id,
        status: 'active',
        subscribedAt: new Date(),
      });
      console.log('Newsletter subscription created for new user');
    } catch (subscriptionError) {
      console.error('Failed to create newsletter subscription:', subscriptionError);
      // Don't fail registration if subscription creation fails
    }
    
    // Verify the user was saved correctly by querying it back
    const savedUser = await User.findById(user._id);
    console.log('Saved user verification fields:', {
      isEmailVerified: savedUser?.isEmailVerified,
      hasToken: !!savedUser?.verificationToken,
      tokenMatch: savedUser?.verificationToken === verificationToken,
      expiry: savedUser?.verificationTokenExpiry
    });
    
    // Send verification email
    try {
      const url = new URL(req.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
      console.log('Verification link:', verificationLink);
      
      const emailHtml = getWelcomeEmailTemplate(name, verificationLink);
      
      await sendMail({
        to: email,
        subject: 'Welcome to Opalineart - Verify Your Email',
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails, user can request resend later
    }
    
    return NextResponse.json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      error: 'Registration failed. Please try again.' 
    }, { status: 500 });
  }
}
