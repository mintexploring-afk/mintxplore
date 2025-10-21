# Visual Guide - Profile Route Integration

## 🎯 Where to Find Edit Profile

### Option 1: Sidebar (Left Navigation)

```
┌─────────────────────┐
│ 🔷 Opalineart      │
│                     │
│ Account overview    │
│ Mint NFT           │
│ My NFT profile     │
│ Transaction        │
│ Market-place       │
│ NFT transactions   │
│ ⚙️ Edit Profile ←  │ NEW!
│                     │
│ 🚪 Sign Out        │
└─────────────────────┘
```

### Option 2: Dashboard Card (Main Content)

```
┌─────────────────────────────────────────────────────────┐
│  Account Overview                                        │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐         │
│  │ Account  │  │  Edit        │  │  Total   │         │
│  │ Balance  │  │  Profile ⚙️  │  │  NFTs    │         │
│  │          │  │              │  │          │         │
│  │  $0.00   │  │  Update your │  │    0     │         │
│  │          │  │  information │  │          │         │
│  └──────────┘  └──────────────┘  └──────────┘         │
│                     ↑ NEW!                              │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Visual Design

### Dashboard Card Design

```
╔═══════════════════════════════════╗
║  Edit Profile            ⚙️       ║  ← Blue gradient background
║                                    ║
║  Update your personal information ║
║  and avatar                        ║
╚═══════════════════════════════════╝
     ↑ Hover: Shadow grows
     ↑ Icon scales on hover
```

**Colors:**
- Background: Blue-50 to Indigo-50 gradient
- Border: Blue-200
- Title: Blue-900
- Icon: Blue-600
- Description: Blue-700

### Sidebar Item Design

```
Normal State:
┌─────────────────────┐
│ ⚙️  Edit Profile    │  ← Gray text
└─────────────────────┘

Active/Hover State:
┌─────────────────────┐
│ ⚙️  Edit Profile    │  ← Indigo background
└─────────────────────┘
```

## 🔄 User Journey

### Journey 1: From Sidebar

```
Dashboard
    ↓ (User clicks "Edit Profile" in sidebar)
Edit Profile Page
    ↓ (User fills form)
    ↓ (User uploads avatar)
    ↓ (User clicks "Save Changes")
Dashboard (Success message)
```

### Journey 2: From Dashboard Card

```
Dashboard (Account Overview)
    ↓ (User sees blue gradient card)
    ↓ (User hovers - icon animates)
    ↓ (User clicks card)
Edit Profile Page
    ↓ (User updates profile)
    ↓ (User saves)
Dashboard (Returns with success)
```

## 📱 Responsive Layouts

### Desktop View (1024px+)

```
┌──────┬────────────────────────────┬──────┐
│      │  ┌──────┐ ┌──────┐ ┌──────┐│      │
│ Side │  │ Bal. │ │Edit P│ │ NFTs ││ Prof │
│ bar  │  └──────┘ └──────┘ └──────┘│ Card │
│      │                             │      │
│      │  Wallet Balance             │      │
│      │  ┌─────────────────────┐   │      │
│      │  │ ETH    │ 0.00       │   │      │
│      │  └─────────────────────┘   │      │
└──────┴────────────────────────────┴──────┘
```

### Tablet View (768px - 1023px)

```
┌──────┬────────────────────────────┐
│      │  ┌──────────────────────┐  │
│ Side │  │  Account Balance     │  │
│ bar  │  ├──────────────────────┤  │
│      │  │  Edit Profile        │  │
│      │  ├──────────────────────┤  │
│      │  │  Total NFTs          │  │
│      │  └──────────────────────┘  │
└──────┴────────────────────────────┘
```

### Mobile View (< 768px)

```
┌─────────────────────────┐
│  Sidebar (Collapsible)  │
├─────────────────────────┤
│  Account Balance        │
│  $0.00                  │
├─────────────────────────┤
│  Edit Profile ⚙️         │
│  Update your info...    │
├─────────────────────────┤
│  Total NFTs             │
│  0                      │
└─────────────────────────┘
```

## 🎬 Animations

### Hover Effects

**Dashboard Card:**
```
Initial:  [   Edit Profile   ]
Hover:    [   Edit Profile   ]  ← Shadow grows
                  ⚙️               ← Icon scales 110%
```

**Sidebar Item:**
```
Initial:  ⚙️  Edit Profile
Hover:    ⚙️  Edit Profile    ← Gray background fades in
```

## 🎯 Click Areas

### Dashboard Card
```
╔═══════════════════════════════════╗
║ ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ║
║ ↑ ↑ ↑ ENTIRE CARD IS CLICKABLE ↑ ║
║ → → → → → → → → → → → → → → → → → ║
╚═══════════════════════════════════╝
```

### Sidebar Item
```
┌─────────────────────────────────┐
│ ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←│
│ ⚙️  Edit Profile                 │
│ → → → → → → → → → → → → → → → →│
└─────────────────────────────────┘
```

## 🔍 Interactive States

### Dashboard Card States

1. **Normal:**
   - Light blue gradient
   - Standard shadow
   - Normal icon size

2. **Hover:**
   - Same gradient
   - Enhanced shadow (shadow-md)
   - Icon scales to 110%
   - Smooth transition

3. **Active (Clicking):**
   - Brief press effect
   - Navigates immediately

### Sidebar States

1. **Normal:**
   - Gray text
   - White background
   - Standard icon

2. **Hover:**
   - Gray text
   - Light gray background (gray-50)
   - Smooth transition

3. **Active (Selected):**
   - Indigo text
   - Indigo background (indigo-50)
   - Bold font

## 📍 Location Reference

```
Your Dashboard Structure:
├─ Sidebar (Left - 64px width on desktop)
│  ├─ Logo
│  ├─ Menu Items
│  │  ├─ Account overview
│  │  ├─ Mint NFT
│  │  ├─ My NFT profile
│  │  ├─ Transaction
│  │  ├─ Market-place
│  │  ├─ NFT transactions
│  │  └─ Edit Profile ← NEW!
│  └─ Sign Out
│
├─ Main Content (Center - flex-1)
│  └─ Account Overview
│     ├─ Quick Stats Grid
│     │  ├─ Account Balance
│     │  ├─ Edit Profile Card ← NEW!
│     │  └─ Total NFTs
│     └─ Wallet Balance
│
└─ Profile Card (Right - 80px on desktop)
```

## 💡 Visual Tips

1. **Finding Edit Profile in Sidebar:**
   - Look for the gear-person icon (⚙️👤)
   - It's above the "Sign Out" button
   - Indigo color when selected

2. **Finding Edit Profile Card:**
   - Look in the top section of dashboard
   - Blue gradient stands out
   - Middle card in 3-card layout

3. **Recognizing Active State:**
   - Sidebar: Indigo background
   - Card: Enhanced shadow on hover

## 🎨 Color Reference

```
Edit Profile Card:
- Background: linear-gradient(to bottom right, #EFF6FF, #EEF2FF)
- Border: #BFDBFE
- Title: #1E3A8A
- Icon: #2563EB
- Text: #1D4ED8

Sidebar Item:
- Normal Text: #374151
- Hover BG: #F9FAFB
- Active BG: #EEF2FF
- Active Text: #4F46E5
```

## ✨ Summary

Two prominent, beautiful ways to access Edit Profile:
1. ⚙️ **Sidebar Menu** - Traditional navigation
2. 💳 **Dashboard Card** - Quick access with visual appeal

Both methods lead to the same comprehensive edit profile page! 🎉
