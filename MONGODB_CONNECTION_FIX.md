# MongoDB Connection Error - Fix Guide

## 🔴 Current Error

```
[Error: querySrv ESERVFAIL _mongodb._tcp.cluster0.8emtttt.mongodb.net]
```

This error means the MongoDB cluster hostname is incorrect or doesn't exist.

## ✅ Solutions

### Option 1: Get Correct MongoDB Atlas Connection String (RECOMMENDED)

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Login** with your account
3. **Select your cluster** (or create a new one)
4. **Click "Connect" button**
5. **Choose "Drivers"** or "Connect your application"
6. **Copy the connection string** (looks like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. **Replace `<username>` and `<password>`** with your actual credentials
8. **Update `.env.local`**:
   ```bash
   MONGODB_URI="mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
   ```

### Option 2: Create New MongoDB Atlas Cluster (FREE)

If your cluster doesn't exist or was deleted:

1. **Go to**: https://cloud.mongodb.com
2. **Sign up** or **login**
3. **Click "Build a Database"**
4. **Choose "M0 FREE"** tier
5. **Select a cloud provider** (AWS/Google/Azure)
6. **Choose region** (closest to you)
7. **Create cluster** (takes 3-5 minutes)
8. **Create database user**:
   - Username: `walshak1999`
   - Password: Generate or use your own
9. **Add IP Address**:
   - Click "Network Access"
   - Add IP: `0.0.0.0/0` (allow from anywhere - for development)
10. **Get connection string** (step 1 above)

### Option 3: Use Local MongoDB (Development Only)

Install MongoDB locally:

**Windows:**
```powershell
# Download from: https://www.mongodb.com/try/download/community
# Or use Chocolatey:
choco install mongodb
```

**Update `.env.local`:**
```bash
MONGODB_URI="mongodb://localhost:27017/mint_explore"
```

### Option 4: Quick Test with MongoDB Demo URI

For quick testing, update your `.env.local`:

```bash
# This won't work for production, just shows the format
MONGODB_URI="mongodb://localhost:27017/mint_explore"
```

## 🔧 Common Issues & Fixes

### Issue 1: Wrong Cluster Name
**Error**: `ESERVFAIL _mongodb._tcp.cluster0.8emtttt.mongodb.net`

**Fix**: The part `8emtttt` looks incorrect. It should be something like:
- `cluster0.xxxxx.mongodb.net` (where xxxxx is 5-7 random chars)
- Example: `cluster0.abc123.mongodb.net`

### Issue 2: Network Access Not Configured
**Error**: Connection timeout

**Fix**: 
1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (or your specific IP)
3. Wait 1-2 minutes for changes to apply

### Issue 3: Wrong Username/Password
**Error**: Authentication failed

**Fix**:
1. Go to Database Access in MongoDB Atlas
2. Edit user or create new one
3. Use strong password without special characters that need URL encoding
4. Update `.env.local` with correct credentials

### Issue 4: Cluster Paused/Deleted
**Error**: ESERVFAIL or connection refused

**Fix**:
1. Check if cluster is paused in Atlas
2. Resume cluster or create new one
3. Get fresh connection string

## 📝 Correct Connection String Format

```bash
MONGODB_URI="mongodb+srv://USERNAME:PASSWORD@CLUSTER_HOST/DATABASE?retryWrites=true&w=majority"
```

**Example:**
```bash
MONGODB_URI="mongodb+srv://walshak1999:TES5bwQ5ZOSq5Akn@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
```

**Parts explained:**
- `mongodb+srv://` - Protocol (use SRV for Atlas)
- `USERNAME` - Your database username
- `PASSWORD` - Your database password
- `CLUSTER_HOST` - Your cluster hostname (from Atlas)
- `DATABASE` - Optional, defaults to test
- `retryWrites=true&w=majority` - Connection options

## 🧪 Test Your Connection

After updating `.env.local`, test it:

1. **Stop your dev server** (Ctrl+C)
2. **Restart**:
   ```bash
   npm run dev
   ```
3. **Try logging in** at: http://localhost:3000/login
4. **Check terminal** for errors

## 🎯 Next Steps

1. ✅ Get correct MongoDB connection string from Atlas
2. ✅ Update `.env.local` file
3. ✅ Restart dev server
4. ✅ Test login/register

## 💡 Pro Tips

- **Never commit `.env.local`** to git (it's in .gitignore)
- **Use environment variables** for sensitive data
- **Free tier limits**: 512MB storage, shared resources
- **Backup your connection string** somewhere safe
- **Use different clusters** for dev/staging/production

## 🆘 Still Having Issues?

If you continue to see errors:

1. **Check MongoDB Atlas Status**: https://status.mongodb.com/
2. **Verify your cluster exists** and is running
3. **Check firewall/antivirus** isn't blocking connections
4. **Try from different network** (mobile hotspot)
5. **Contact MongoDB support** if Atlas issue

---

**Need the exact steps?** Follow Option 1 above to get your correct connection string! 🚀
