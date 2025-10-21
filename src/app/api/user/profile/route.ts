import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { User } from '@/models/User';
import { NewsletterSubscription } from '@/models/NewsletterSubscription';
import bcrypt from 'bcryptjs';
import { verifyToken, extractTokenFromHeader } from '@/utils/auth';

// GET current user profile
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Get user from database using verified token's userId
    const user = await User.findById(payload.userId).select('-password -resetToken -resetTokenExpiry');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure newsletterSubscribed has a value
    const userData = user.toObject();
    if (userData.newsletterSubscribed === undefined) {
      userData.newsletterSubscribed = true;
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// UPDATE user profile
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    
    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const body = await req.json();
    const { name, username, bio, avatar, currentPassword, newPassword, newsletterSubscribed } = body;

    console.log('Profile update request - newsletterSubscribed value:', newsletterSubscribed, 'type:', typeof newsletterSubscribed);

    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if username is being changed and already exists
    // Note: Email cannot be changed for security reasons

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUsername) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }

    // Handle password change
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    // Update user fields
    if (name) user.name = name;
    // Email cannot be changed
    if (username) user.username = username;
    if (bio !== undefined) user.set('bio', bio); // If bio field doesn't exist in schema yet
    if (avatar) user.avatar = avatar;
    if (newsletterSubscribed !== undefined) {
      console.log('Updating newsletterSubscribed to:', newsletterSubscribed);
      user.newsletterSubscribed = newsletterSubscribed;

      // Handle newsletter subscription entry
      const existingSubscription = await NewsletterSubscription.findOne({ email: user.email.toLowerCase() });

      if (newsletterSubscribed) {
        // Subscribe: Create or reactivate subscription
        if (existingSubscription) {
          existingSubscription.status = 'active';
          existingSubscription.name = user.name;
          existingSubscription.userId = user._id as unknown as import('mongoose').Types.ObjectId;
          existingSubscription.subscribedAt = new Date();
          existingSubscription.unsubscribedAt = undefined;
          await existingSubscription.save();
          console.log('Reactivated subscription for:', user.email);
        } else {
          await NewsletterSubscription.create({
            email: user.email.toLowerCase(),
            name: user.name,
            userId: user._id as unknown as import('mongoose').Types.ObjectId,
            status: 'active',
            subscribedAt: new Date(),
          });
          console.log('Created new subscription for:', user.email);
        }
      } else {
        // Unsubscribe: Mark as inactive
        if (existingSubscription) {
          existingSubscription.status = 'inactive';
          existingSubscription.unsubscribedAt = new Date();
          await existingSubscription.save();
          console.log('Marked subscription as inactive for:', user.email);
        }
      }
    }

    await user.save();
    console.log('User saved with newsletterSubscribed:', user.newsletterSubscribed);

    // Return updated user without sensitive data
    const updatedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      bio: user.get('bio'),
      newsletterSubscribed: user.newsletterSubscribed !== undefined ? user.newsletterSubscribed : true,
    };

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
