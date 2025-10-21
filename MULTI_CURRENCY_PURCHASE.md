# NFT Purchase with Multiple Payment Options

## Feature Overview
Users can now purchase NFTs using either WETH or ETH balance. When clicking "Buy", a payment modal shows:
- User's WETH and ETH balances
- Required amount in each currency
- Conversion rate between ETH and WETH
- Clear indication of which payment method is available

## Implementation Summary

### 1. Exchange Rate Settings
**File**: `/src/models/Settings.ts`
- Added `ETH_TO_WETH` field to exchangeRates (default: 1)
- This rate allows admin to configure how much WETH equals 1 ETH

**File**: `/src/app/admin/exchange-rates/page.tsx`
- Added ETH to WETH conversion rate input field
- Shows preview: "1 ETH = X WETH"
- Includes explanation for NFT purchases

**Admin Dashboard**: New menu item "Exchange Rates" with dollar sign icon

### 2. Purchase API Enhancement
**File**: `/src/app/api/nfts/[id]/purchase/route.ts`

**New Features**:
- Accepts `paymentCurrency` in request body ('ETH' or 'WETH')
- Fetches ETH_TO_WETH rate from Settings
- Calculates required amount based on payment currency:
  - WETH: Direct price (NFT priced in WETH)
  - ETH: `nftPrice / ethToWethRate`
- Deducts from buyer's chosen currency
- Credits seller always in WETH
- Logs transactions with conversion details

**Transaction Metadata**:
```json
{
  "paymentCurrency": "ETH",
  "nftPrice": 0.5,
  "conversionRate": 1,
  "buyerPaidAmount": 0.5
}
```

### 3. Payment Selection Modal
**File**: `/src/components/PaymentModal.tsx`

**Features**:
- Shows NFT price in WETH
- Two payment options (radio buttons):
  - **Pay with WETH**: Shows required WETH, user's WETH balance, availability
  - **Pay with ETH**: Shows required ETH (converted), user's ETH balance, conversion rate
- Color-coded status:
  - Green border + "✓ Available" = Sufficient balance
  - Red border + "Insufficient" = Not enough funds
- Disabled options if insufficient balance
- Info box explaining how payment works
- Auto-calculates ETH amount needed using conversion rate

**User Experience**:
1. User clicks "Buy" button
2. Modal opens showing both payment options
3. If insufficient WETH but sufficient ETH:
   - WETH option shows red border with "need X more WETH"
   - ETH option shows green border with "✓ Available"
   - Shows conversion: "1 ETH = X WETH"
4. User clicks on available payment option
5. Purchase processes with chosen currency

### 4. NFT Detail Page Integration
**File**: `/src/app/nft/[id]/page.tsx`

**New State**:
- `showPaymentModal`: Controls modal visibility
- `userBalances`: Stores user's ETH and WETH balances
- `ethToWethRate`: Current conversion rate from settings

**New Functions**:
- `fetchUserBalances()`: Gets user's current balances from profile API
- `fetchExchangeRates()`: Gets ETH_TO_WETH rate from exchange rates API
- `handleBuyClick()`: Opens payment modal (replaces direct purchase)
- `handlePurchase(paymentCurrency)`: Executes purchase with selected currency

**Flow**:
```
User clicks "Buy"
  ↓
handleBuyClick() called
  ↓
Payment modal opens
  ↓
User selects ETH or WETH
  ↓
handlePurchase(currency) called
  ↓
API request with paymentCurrency
  ↓
Success → Redirect to dashboard
```

## How It Works

### Scenario 1: User has WETH
- NFT costs: 0.5 WETH
- User has: 0.6 WETH, 0 ETH
- Modal shows: WETH option available (green)
- User clicks WETH option
- Purchase: Deducts 0.5 WETH from buyer

### Scenario 2: User has only ETH
- NFT costs: 0.5 WETH
- User has: 0 WETH, 0.5 ETH
- ETH_TO_WETH rate: 1
- Modal shows:
  - WETH option unavailable (red) - "need 0.5 more WETH"
  - ETH option available (green) - "Required: 0.5 ETH"
- User clicks ETH option
- Purchase: Deducts 0.5 ETH from buyer, credits 0.5 WETH to seller

### Scenario 3: User has both
- NFT costs: 0.5 WETH
- User has: 0.3 WETH, 0.5 ETH
- Modal shows: Both options available
- User can choose which currency to use

### Scenario 4: Insufficient funds
- NFT costs: 0.5 WETH
- User has: 0.1 WETH, 0.2 ETH
- Modal shows: Both options unavailable (red)
- Error message: "Insufficient Balance: You don't have enough ETH or WETH"

## Admin Configuration

### Setting Exchange Rates
1. Login as admin
2. Navigate to "Exchange Rates" in sidebar
3. Set three rates:
   - **ETH to USDT**: For price display (e.g., 2500)
   - **WETH to USDT**: For price display (e.g., 2500)
   - **ETH to WETH**: For payment conversion (e.g., 1)
4. Click "Save Exchange Rates"

### Example Rates
```json
{
  "ETH": 2500,      // 1 ETH = $2,500 USDT
  "WETH": 2500,     // 1 WETH = $2,500 USDT
  "ETH_TO_WETH": 1  // 1 ETH = 1 WETH
}
```

If ETH is worth more than WETH:
```json
{
  "ETH_TO_WETH": 1.05  // 1 ETH = 1.05 WETH
}
```

## Transaction Logging

### Buyer Transaction (Paid with ETH)
```json
{
  "user": "buyer_id",
  "type": "nft-purchase",
  "amount": -0.5,
  "currency": "ETH",
  "note": "Purchased NFT: Cool Art (Paid in ETH)",
  "metadata": {
    "nftId": "nft_id",
    "nftName": "Cool Art",
    "sellerId": "seller_id",
    "paymentCurrency": "ETH",
    "nftPrice": 0.5,
    "conversionRate": 1
  }
}
```

### Seller Transaction (Always WETH)
```json
{
  "user": "seller_id",
  "type": "nft-sale",
  "amount": 0.5,
  "currency": "WETH",
  "note": "Sold NFT: Cool Art (Received in WETH)",
  "metadata": {
    "nftId": "nft_id",
    "nftName": "Cool Art",
    "buyerId": "buyer_id",
    "buyerPaidIn": "ETH",
    "buyerPaidAmount": 0.5
  }
}
```

## Files Modified
1. `/src/models/Settings.ts` - Added ETH_TO_WETH rate
2. `/src/app/admin/exchange-rates/page.tsx` - Added conversion rate UI
3. `/src/app/api/nfts/[id]/purchase/route.ts` - Multi-currency purchase
4. `/src/components/PaymentModal.tsx` - NEW: Payment selection modal
5. `/src/app/nft/[id]/page.tsx` - Integrated payment modal
6. `/src/components/DashboardSidebar.tsx` - Added Exchange Rates menu

## Testing
1. Set ETH_TO_WETH rate in admin (e.g., 1)
2. Create user with ETH balance, no WETH
3. Try to buy NFT priced in WETH
4. Payment modal shows:
   - "Pay with WETH" - Red, insufficient
   - "Pay with ETH" - Green, available
5. Click ETH option
6. Purchase completes with ETH deduction

## Benefits
- ✅ Users can use either currency they have available
- ✅ Clear visual feedback on balance availability
- ✅ Transparent conversion rates shown to user
- ✅ Admin control over conversion rates
- ✅ All transactions properly logged with metadata
- ✅ Seller always receives WETH (standard currency)

## Date
October 20, 2025
