# Edit Profile Feature

## Overview
A unified edit profile page that allows all users (admin and regular users) to edit their profile information with avatar upload functionality using Cloudinary.

## Features

### 1. Profile Information
- **Name**: User's full name
- **Username**: Unique username
- **Email**: User's email address
- **Bio**: Short biography (optional)
- **Avatar**: Profile picture with Cloudinary upload

### 2. Avatar Upload
- Upload images up to 5MB
- Automatic validation for file type and size
- Real-time preview before upload
- Images stored in Cloudinary
- Organized in 'avatars' folder

### 3. Password Management
- Optional password change section
- Requires current password for verification
- New password must be at least 6 characters
- Password confirmation validation

### 4. Role Display
- Admin users see an "Admin" badge
- Same interface for all user types

## API Endpoints

### GET /api/user/profile
Fetch current user's profile information.

**Query Parameters:**
- `userId`: User ID

**Headers:**
- `x-user-id`: User ID for authentication

**Response:**
```json
{
  "user": {
    "id": "userId",
    "name": "User Name",
    "email": "user@example.com",
    "username": "username",
    "avatar": "cloudinary_url",
    "bio": "User bio",
    "role": "user"
  }
}
```

### PUT /api/user/profile
Update user profile information.

**Query Parameters:**
- `userId`: User ID

**Headers:**
- `x-user-id`: User ID for authentication
- `Content-Type`: application/json

**Body:**
```json
{
  "name": "New Name",
  "email": "newemail@example.com",
  "username": "newusername",
  "bio": "New bio",
  "avatar": "cloudinary_url",
  "currentPassword": "optional",
  "newPassword": "optional"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

### POST /api/upload
Upload avatar image to Cloudinary.

**Content-Type:** multipart/form-data

**Body:**
- `file`: Image file

**Response:**
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/.../image.jpg",
  "publicId": "avatars/xyz123"
}
```

## Environment Variables

Make sure your `.env.local` file contains:

```env
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

## Cloudinary Setup

1. Create a Cloudinary account at https://cloudinary.com
2. Go to Settings > Upload
3. Enable unsigned uploading
4. Create an upload preset named `opalineart` (or update the preset name in the code)
5. Set the preset to "Unsigned" mode

## Usage

### For Users
1. Navigate to `/edit-profile`
2. Update any profile fields
3. Optionally upload a new avatar
4. Optionally change password
5. Click "Save Changes"

### Authentication
Currently uses localStorage for user authentication. In production, implement proper JWT or session-based authentication:

```typescript
// Store user info after login
localStorage.setItem('userId', userId);
localStorage.setItem('user', JSON.stringify(userData));
localStorage.setItem('token', authToken);
```

## Security Considerations

### Current Implementation (Development)
- Uses localStorage for session management
- User ID passed via query params and headers
- Basic validation only

### Production Recommendations
1. Implement JWT authentication
2. Use HTTP-only cookies
3. Add CSRF protection
4. Rate limit upload endpoints
5. Validate file types on server
6. Scan uploaded files for malware
7. Implement proper session management
8. Add 2FA for sensitive operations

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts          # Cloudinary upload endpoint
│   │   └── user/
│   │       └── profile/
│   │           └── route.ts      # Profile GET/PUT endpoints
│   └── edit-profile/
│       └── page.tsx               # Edit profile UI
├── contexts/
│   └── AuthContext.tsx            # Authentication context
└── models/
    └── User.ts                    # User model with bio field
```

## Styling
- Uses Tailwind CSS
- Responsive design (mobile-first)
- Loading states for async operations
- Error and success notifications

## Future Enhancements
1. Image cropping before upload
2. Multiple image support
3. Profile visibility settings
4. Social media links
5. Email verification on email change
6. Account deletion option
7. Activity log
8. Export user data
