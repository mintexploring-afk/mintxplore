# Balance Fetching Fix

## Issue
User balances were showing as 0 in the payment modal even when the user had a balance.

## Root Cause
The `/api/user/profile` endpoint returns the user data in this format:
```json
{
  "user": {
    "balances": {
      "ETH": 10,
      "WETH": 5
    }
  }
}
```

But the code was trying to access `data.balances` instead of `data.user.balances`.

## Fix Applied
**File**: `/src/app/nft/[id]/page.tsx`

### Changed from:
```typescript
const data = await res.json()
setUserBalances({
  ETH: data.balances?.ETH || 0,
  WETH: data.balances?.WETH || 0
})
```

### Changed to:
```typescript
const data = await res.json()
console.log('User profile data:', data) // Debug log
setUserBalances({
  ETH: data.user?.balances?.ETH || 0,
  WETH: data.user?.balances?.WETH || 0
})
console.log('Set balances:', {
  ETH: data.user?.balances?.ETH || 0,
  WETH: data.user?.balances?.WETH || 0
})
```

## Additional Improvements

1. **Added token validation**: Check if token exists before making the request
2. **Added debug logging**: Console logs to help troubleshoot balance issues
3. **Refresh on modal open**: Updated `handleBuyClick` to refresh balances and exchange rates when opening the payment modal
4. **Made async**: `handleBuyClick` is now async to properly await balance refresh

## Testing
1. Login to the application
2. Navigate to any NFT detail page
3. Open browser console (F12)
4. Click "Buy" button
5. Check console logs:
   - "User profile data:" should show your user object with balances
   - "Set balances:" should show the extracted ETH and WETH values
6. Payment modal should now display your actual balances

## Date
October 20, 2025
