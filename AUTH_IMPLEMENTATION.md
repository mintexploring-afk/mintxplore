# Authentication Implementation Guide

## Overview
This application now uses a secure cookie-based authentication system with JWT tokens using the `js-cookie` package.

## What Was Fixed

### 1. **Cookie Management with js-cookie**
- ✅ Installed `js-cookie` and `@types/js-cookie` packages
- ✅ Updated `AuthContext` to use cookies instead of localStorage
- ✅ Cookies are set with 7-day expiration and `sameSite: 'strict'` for security

### 2. **JWT Token Generation**
- ✅ Installed `jsonwebtoken` and `@types/jsonwebtoken` packages
- ✅ Login API now generates proper JWT tokens (not mock tokens)
- ✅ Tokens include userId, email, and role
- ✅ Tokens expire after 7 days
- ✅ Added `JWT_SECRET` to `.env.local`

### 3. **Login Flow**
- ✅ Login page now uses `AuthContext`
- ✅ User data and token are stored in cookies after successful login
- ✅ User is redirected to dashboard after login

### 4. **Protected Routes**
- ✅ Dashboard checks authentication on mount
- ✅ Edit Profile checks authentication on mount
- ✅ Unauthenticated users are redirected to login page

### 5. **API Authorization**
- ✅ Created `auth.ts` utility with token verification functions
- ✅ All API calls now include `Authorization: Bearer <token>` header
- ✅ Profile API verifies JWT tokens before processing requests
- ✅ Invalid/missing tokens return 401 Unauthorized

### 6. **Logout Functionality**
- ✅ Logout removes all cookies
- ✅ User is redirected to login page after logout

## How It Works

### Authentication Flow

```
1. User logs in with email/password
   ↓
2. API verifies credentials and generates JWT token
   ↓
3. Login page receives user data + token
   ↓
4. AuthContext stores user data and token in cookies
   ↓
5. User is redirected to dashboard
   ↓
6. Protected pages check isAuthenticated from AuthContext
   ↓
7. API calls include Authorization header with token
   ↓
8. API routes verify token before processing
```

### Cookie Structure

The following cookies are set on successful login:

```javascript
// Cookie Name: user
// Value: JSON stringified user object
{
  "id": "user_id",
  "name": "User Name",
  "email": "user@email.com",
  "username": "username",
  "avatar": "avatar_url",
  "bio": "user bio",
  "role": "user"
}

// Cookie Name: token
// Value: JWT token string
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// Cookie Name: userId
// Value: User ID string
"507f1f77bcf86cd799439011"
```

All cookies have:
- **Expires**: 7 days
- **SameSite**: strict
- **Path**: / (root)

### API Request Headers

All authenticated API requests must include:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
}
```

## Files Modified

### 1. `src/contexts/AuthContext.tsx`
- Changed from localStorage to js-cookie
- Added `getToken()` method
- Improved error handling for cookie parsing

### 2. `src/app/login/page.tsx`
- Imported and used `useAuth` hook
- Calls `login()` from AuthContext after successful authentication
- Added error handling

### 3. `src/app/api/auth/login/route.ts`
- Generates real JWT tokens (not mock)
- Returns complete user object with token
- Added error handling

### 4. `src/app/edit-profile/page.tsx`
- Uses `useAuth` hook to get authentication state
- Redirects to login if not authenticated
- Includes Authorization header in API calls
- Uses cookies instead of localStorage

### 5. `src/app/dashboard/page.tsx`
- Uses `useAuth` hook to get user data
- Redirects to login if not authenticated
- Shows loading state while checking authentication

### 6. `src/components/DashboardSidebar.tsx`
- Uses `logout()` from AuthContext
- Redirects to login after logout

### 7. `src/app/api/user/profile/route.ts`
- Verifies JWT tokens on all requests
- Returns 401 for invalid/missing tokens
- Uses userId from verified token (not headers)

### 8. `src/utils/auth.ts` (NEW)
- `verifyToken()` - Verifies JWT tokens
- `extractTokenFromHeader()` - Extracts token from Authorization header

### 9. `.env.local`
- Added `JWT_SECRET` for token signing/verification

## Security Considerations

### ⚠️ Important for Production

1. **Change JWT_SECRET**: Update the `JWT_SECRET` in `.env.local` to a long, random string:
   ```bash
   # Generate a secure random string (example using Node.js)
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **HTTPS Only**: In production, set cookies with `secure: true` flag:
   ```javascript
   Cookies.set('token', token, { 
     expires: 7, 
     sameSite: 'strict',
     secure: true  // Only over HTTPS
   });
   ```

3. **HttpOnly Cookies**: Consider using HTTP-only cookies for tokens (requires server-side cookie management)

4. **CORS Configuration**: Ensure proper CORS settings for your API

5. **Token Refresh**: Implement token refresh mechanism for better UX

## Testing the Implementation

### 1. Test Login
```bash
# Login should:
- Set cookies (check browser DevTools > Application > Cookies)
- Store user data in AuthContext
- Redirect to dashboard
```

### 2. Test Protected Routes
```bash
# Without authentication:
- /dashboard → redirects to /login
- /edit-profile → redirects to /login

# With authentication:
- /dashboard → shows dashboard
- /edit-profile → shows profile page
```

### 3. Test API Calls
```bash
# Check Network tab in DevTools:
- API requests should include "Authorization: Bearer <token>" header
- Profile API should return user data (not 401)
```

### 4. Test Logout
```bash
# Logout should:
- Clear all cookies
- Reset AuthContext
- Redirect to login page
```

## Troubleshooting

### Issue: Redirected to login after successful sign-in

**Cause**: Token not being stored or retrieved properly

**Solution**:
1. Check browser cookies (DevTools > Application > Cookies)
2. Verify `token`, `user`, and `userId` cookies are set
3. Check console for any errors

### Issue: API returns 401 Unauthorized

**Cause**: Token not included in request or invalid token

**Solution**:
1. Check Network tab - verify Authorization header is present
2. Verify token format: `Bearer <token>`
3. Check JWT_SECRET matches between token generation and verification

### Issue: User data not persisting after page refresh

**Cause**: Cookies not being read on mount

**Solution**:
1. Check `AuthContext` useEffect is running
2. Verify cookies exist and haven't expired
3. Check for cookie parsing errors in console

## Next Steps

### Recommended Improvements

1. **Token Refresh**: Implement refresh token mechanism
2. **Remember Me**: Add option for longer cookie expiration
3. **Rate Limiting**: Add rate limiting to login endpoint
4. **2FA**: Consider adding two-factor authentication
5. **Session Management**: Track active sessions
6. **Activity Logging**: Log authentication events

## Environment Variables

Required in `.env.local`:

```bash
# JWT Secret - MUST be changed in production
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production-123456789

# MongoDB Connection
MONGODB_URI=your-mongodb-connection-string

# Email Configuration (for password reset)
MAIL_HOST=your-mail-host
MAIL_PORT=465
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password

# Cloudinary (for image uploads)
CLOUDINARY_URL=your-cloudinary-url
```

## Summary

Your authentication system now:
- ✅ Uses cookies (js-cookie package) for client-side storage
- ✅ Generates and verifies real JWT tokens
- ✅ Includes auth tokens in all API calls
- ✅ Protects routes from unauthorized access
- ✅ Provides proper login/logout flow
- ✅ Maintains authentication state across page refreshes

The issue where you were redirected to login when navigating to the profile page is now **FIXED**! 🎉
