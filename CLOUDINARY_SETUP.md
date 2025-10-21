# Cloudinary Setup Instructions

## Step 1: Get Your Cloudinary Credentials

1. Go to https://cloudinary.com and create an account or login
2. From your Dashboard, you'll see your cloud name in the "Product Environment Credentials" section
3. Your current URL in `.env.local` is:
   ```
   CLOUDINARY_URL=cloudinary://453837177485791:E6dVE1VmRu-7nZ0Gws0-GPx98D8@dxeetijm3
   ```
   This means your cloud name is: `dxeetijm3`

## Step 2: Create an Upload Preset

1. Go to Settings > Upload (https://console.cloudinary.com/settings/upload)
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Set the following:
   - **Preset name**: `opalineart`
   - **Signing Mode**: Select "Unsigned"
   - **Folder**: `avatars` (optional but recommended)
   - **Allowed formats**: jpg, png, gif, webp
5. Click "Save"

## Step 3: Configure Your Application

Your `.env.local` file already has the Cloudinary URL. The app will automatically:
- Extract the cloud name from the URL
- Use it to upload images to: `https://api.cloudinary.com/v1_1/dxeetijm3/image/upload`

## Step 4: Test the Upload

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/edit-profile

3. Try uploading an avatar image

## Troubleshooting

### Error: "Cloudinary configuration missing"
- Check that CLOUDINARY_URL exists in `.env.local`
- Restart your dev server after adding environment variables

### Error: "Failed to upload image" (400)
- The upload preset `opalineart` doesn't exist
- The preset is not set to "Unsigned" mode
- Double-check the preset name matches exactly

### Error: "Failed to upload image" (401)
- Authentication issue with Cloudinary
- Verify your CLOUDINARY_URL is correct
- Check that unsigned uploading is enabled

### Images not displaying
- Add Cloudinary domain to Next.js config (already done in next.config.ts)
- Check browser console for CORS errors
- Verify the image URL is correct

## Testing Without a Database

To test the edit profile page without setting up the full database:

1. Open browser console
2. Set a test user in localStorage:
```javascript
localStorage.setItem('userId', 'test-user-123');
localStorage.setItem('user', JSON.stringify({
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  username: 'testuser',
  avatar: '',
  role: 'user'
}));
```

3. The page will load with test data
4. You can test the avatar upload (it will still upload to Cloudinary)
5. Profile updates will fail until the database is connected

## Production Checklist

- [ ] Set signed upload mode for production
- [ ] Add server-side signature generation
- [ ] Configure upload restrictions (file size, formats)
- [ ] Set up folder structure in Cloudinary
- [ ] Enable automatic backups
- [ ] Configure image transformations
- [ ] Set up CDN caching rules
- [ ] Add monitoring and alerts
