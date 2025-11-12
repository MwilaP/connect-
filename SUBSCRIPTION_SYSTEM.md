# Subscription & Access Control System

## Overview
This document describes the subscription and access control system implemented for the ConnectPro platform.

## Features

### 1. **Free Tier Limitations**
- Clients can view **3 provider profiles per day** for free
- Provider photos are **blurred** for non-subscribed users
- Daily view limit resets every 24 hours

### 2. **Premium Subscription (K100/month)**
- **Unlimited profile views** - no daily restrictions
- **Unblurred photos** - view all provider images in full quality
- **Priority support** - faster customer service responses
- **Save favorites** - bookmark preferred providers

### 3. **Contact Unlock (K30 one-time)**
- Pay once to unlock a specific provider's contact number
- Permanent access to that provider's contact info
- Independent of subscription status

## Database Schema

### Tables Created
1. **subscriptions** - Stores user subscription data
2. **contact_unlocks** - Tracks which contacts users have unlocked
3. **profile_views_tracking** - Monitors daily profile views per user
4. **payments** - Records all payment transactions

### Key Functions
- `get_daily_profile_views_count()` - Returns today's view count for a user
- `is_subscription_active()` - Checks if user has active subscription
- `is_contact_unlocked()` - Verifies if contact is unlocked for user

## Components

### React Components
1. **PaymentModal** - Handles subscription and contact unlock payments
   - Two-step payment process (method selection → payment details)
   - Supports Mobile Money and Card payments
   - Success/failure feedback

2. **AccessRestrictionModal** - Shown when daily limit is reached
   - Displays remaining views
   - Encourages subscription upgrade
   - Shows premium benefits

3. **SubscriptionBanner** - Displays on browse page for free users
   - Shows remaining free views with progress bar
   - Quick upgrade button
   - Mobile-optimized design

4. **ProviderCard** - Updated with blur effect
   - Conditional blur based on subscription status
   - Lock overlay with "Subscribe to view" message
   - Smooth transitions

### Pages
1. **BrowseList** - Browse providers with subscription features
   - Subscription banner for non-subscribers
   - Blurred images for free users
   - Payment modal integration

2. **ProviderDetail** - Individual provider page
   - Blurred photo gallery for non-subscribers
   - Contact unlock functionality
   - Access restriction enforcement
   - Subscription CTA sections

3. **Subscription** - Manage subscription
   - View current plan status
   - See renewal date
   - Cancel subscription
   - Upgrade to premium

### Custom Hooks
**useSubscription** - Main subscription management hook
- `subscriptionStatus` - Current subscription state
- `trackProfileView()` - Record profile view
- `checkContactUnlock()` - Verify contact access
- `unlockContact()` - Purchase contact access
- `subscribe()` - Activate premium subscription
- `cancelSubscription()` - Deactivate subscription

## User Flow

### Free User Journey
1. User browses providers (sees blurred images)
2. Views up to 3 profiles per day
3. On 4th profile attempt → Access Restriction Modal
4. Can upgrade to premium or wait 24 hours

### Subscription Flow
1. Click "Upgrade" button
2. Payment Modal opens
3. Select payment method (Mobile Money or Card)
4. Enter payment details
5. Confirm payment (simulated)
6. Success message → Photos unblur immediately

### Contact Unlock Flow
1. View provider profile
2. Click "Unlock Contact (K30)"
3. Payment Modal opens
4. Complete payment
5. Contact number revealed
6. Access persists permanently

## Visual Design

### Blur Effect
- **Blur radius**: 12-15px (blur-lg in Tailwind)
- **Overlay**: Semi-transparent black (bg-black/50 to bg-black/60)
- **Scale**: Slight zoom (scale-105) for depth effect

### Color Scheme
- **Primary CTA**: Gradient amber to orange (#f59e0b → #f97316)
- **Lock icons**: Amber/gold tones
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f59e0b)

### Mobile-First
- Designed for 375px width
- Touch-friendly buttons (min 44px height)
- Full-width CTAs on mobile
- Responsive grid layouts

## Payment Simulation

Currently, payments are **simulated** with a 2-second delay. To integrate real payments:

1. **Mobile Money Integration**
   - Integrate with MTN or Airtel Money APIs
   - Handle push notifications
   - Verify payment status

2. **Card Payment Integration**
   - Use Stripe, Paystack, or Flutterwave
   - Implement PCI-compliant card handling
   - Add 3D Secure authentication

## Setup Instructions

### 1. Run Database Migration
```bash
# Apply the subscription system migration
psql -d your_database < supabase/migrations/20250110_subscription_system.sql
```

### 2. Environment Variables
Ensure these are set in your `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Test the System
1. Create a client account
2. Browse providers (should see blurred images)
3. View 3 profiles (counter decrements)
4. Try viewing 4th profile (restriction modal appears)
5. Subscribe (payment modal → success)
6. Verify photos unblur
7. Test contact unlock on a provider

## Security Considerations

1. **Row Level Security (RLS)** enabled on all tables
2. Users can only access their own subscription data
3. Contact unlocks are user-specific
4. Payment records are private to each user
5. Server-side validation for all transactions

## Future Enhancements

1. **Email Notifications**
   - Subscription confirmation
   - Renewal reminders
   - Payment receipts

2. **Analytics Dashboard**
   - Track conversion rates
   - Monitor subscription metrics
   - View revenue reports

3. **Promotional Features**
   - Discount codes
   - Free trial periods
   - Referral bonuses

4. **Advanced Features**
   - Yearly subscription option
   - Family/team plans
   - Gift subscriptions

## Troubleshooting

### Photos Not Unblurring
- Check subscription status in database
- Verify `end_date` is in the future
- Ensure `active` field is `true`
- Clear browser cache

### Daily Limit Not Resetting
- Check `view_date` field in `profile_views_tracking`
- Verify timezone settings
- Ensure cron job is running (if implemented)

### Payment Not Processing
- Check browser console for errors
- Verify Supabase connection
- Check RLS policies
- Review payment table for records

## Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase logs
3. Verify database schema is correct
4. Test with different user accounts
