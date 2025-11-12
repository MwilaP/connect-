# Referral Program - Access Guide

## 🎯 How to Access the Referral Dashboard

### For All Users (Clients & Providers)

**URL:** `/referrals`

**Direct Link:** `https://yoursite.com/referrals`

---

## 📍 Navigation Links Added

### ✅ Provider Dashboard
**File:** `src/pages/provider/Dashboard.tsx`

**Desktop Navigation (Top Bar):**
- Browse
- My Profile
- **Referrals** ← NEW!
- Sign Out

**Mobile Navigation (Hamburger Menu):**
- Browse
- My Profile
- **Referrals** ← NEW!
- Sign Out

### ✅ Client Subscription Page
**File:** `src/pages/client/Subscription.tsx`

**Navigation (Top Bar):**
- Browse
- My Profile
- **Referrals** ← NEW!
- Sign Out

---

## 🚀 User Journey

### For Providers:
1. Log in to your account
2. Go to **Provider Dashboard** (`/provider/dashboard`)
3. Click **"Referrals"** in the navigation
4. View your referral code, stats, and earnings
5. Share your referral link with potential clients

### For Clients:
1. Log in to your account
2. Go to **Subscription** page (`/client/subscription`)
3. Click **"Referrals"** in the navigation
4. View your referral code, stats, and earnings
5. Share your referral link with friends

---

## 📊 What Users Can Do

### On the Referral Dashboard (`/referrals`):

1. **View Statistics:**
   - Total referrals
   - Successful referrals (subscribed)
   - Total earnings
   - Pending earnings

2. **Get Referral Link:**
   - Unique referral code displayed
   - Full referral URL
   - One-click copy button
   - Share button (uses Web Share API)

3. **Track Referrals:**
   - See all people you've referred
   - View their status (pending/subscribed/rewarded)
   - Track when they signed up

4. **Monitor Rewards:**
   - View all rewards earned
   - See payment status (pending/paid)
   - Track payment history
   - View payment methods and references

---

## 🎁 How the Referral System Works

### Step 1: Get Your Link
- User navigates to `/referrals`
- System automatically generates unique code (e.g., `ABC123XY`)
- Referral link: `https://yoursite.com/auth/signup?ref=ABC123XY`

### Step 2: Share
- Copy link with one click
- Share via Web Share API (mobile-friendly)
- Share on social media, email, WhatsApp, etc.

### Step 3: Friend Signs Up
- Friend clicks your referral link
- Sees your referral code during signup
- Creates account (tracked automatically)

### Step 4: Friend Subscribes
- When friend subscribes to any plan
- You automatically earn **20,000**
- Reward appears in your dashboard as "Pending"

### Step 5: Get Paid
- Admin processes payment
- Reward status changes to "Paid"
- Payment details recorded

---

## 🔗 Additional Access Points

### You can also add the referral banner to other pages:

```tsx
import { ReferralBanner } from '../../components/referral-banner';

// In your component:
<ReferralBanner />  // Full banner
<ReferralBanner compact />  // Compact version
<ReferralBanner dismissible={false} />  // Non-dismissible
```

**Suggested locations:**
- Home page (`src/pages/Home.tsx`)
- Browse page (`src/pages/browse/BrowseList.tsx`)
- Profile pages
- After successful subscription

---

## 📱 Mobile-Friendly

The referral dashboard is fully responsive:
- Works on all screen sizes
- Touch-friendly buttons
- Web Share API for easy sharing on mobile
- Optimized for both portrait and landscape

---

## 🎨 Visual Features

### Stats Cards:
- 📊 Total Referrals
- ✅ Successful Referrals
- 💰 Total Earnings
- ⏳ Pending Earnings

### Referral Link Section:
- Large, readable referral code
- Copy button with feedback
- Share button with native sharing
- How-it-works explanation

### Tabs:
- **My Referrals:** Track who you've referred
- **My Rewards:** View earnings and payments

### Status Badges:
- 🟡 Pending (waiting for subscription)
- 🔵 Subscribed (earned reward)
- 🟢 Rewarded (payment created)
- ✅ Paid (money received)

---

## 🔐 Security & Privacy

- Users can only see their own referrals
- Row Level Security (RLS) enforced
- Referral codes are unique and validated
- Self-referrals are prevented
- Duplicate referrals are blocked

---

## 💡 Tips for Users

### Maximize Your Earnings:
1. Share your link on social media
2. Send to friends via WhatsApp/Telegram
3. Include in your email signature
4. Share in relevant groups/communities
5. Explain the benefits to potential referrals

### Best Practices:
- Personalize your message when sharing
- Explain what the platform offers
- Mention the benefits of subscribing
- Follow up with referred friends
- Track your referrals regularly

---

## 📞 Support

If users have questions about referrals:
- Check the dashboard for real-time stats
- Contact support for payment inquiries
- Review the referral history for details
- Check payment status in rewards tab

---

## 🎯 Quick Links

- **Referral Dashboard:** `/referrals`
- **Provider Dashboard:** `/provider/dashboard`
- **Client Subscription:** `/client/subscription`
- **Browse Providers:** `/browse`
- **Signup Page:** `/auth/signup`

---

## 🚀 Next Steps

1. **Test the flow:**
   - Log in as a user
   - Navigate to `/referrals`
   - Copy your referral link
   - Test signup with the link

2. **Promote the program:**
   - Add banner to home page
   - Send email announcement
   - Create social media posts
   - Update marketing materials

3. **Monitor performance:**
   - Track conversion rates
   - Review pending payments
   - Process rewards regularly
   - Gather user feedback
