# Referral Program System

## Overview
A comprehensive referral program that allows both clients and providers to refer new users and earn 20,000 when their referrals subscribe to any plan.

## Features

### 1. Automatic Referral Code Generation
- Every user automatically gets a unique referral code upon signup
- Codes are 8-character alphanumeric strings (e.g., "A3B7C9D2")
- Codes are stored in the `referral_codes` table

### 2. Referral Tracking
- Users can share their referral link: `https://yoursite.com/auth/signup?ref=CODE`
- When someone signs up with a referral code, the system tracks the relationship
- Referral status progresses: `pending` → `subscribed` → `rewarded`

### 3. Reward System
- Referrers earn **20,000** when their referred user subscribes
- Rewards are automatically created when a subscription is activated
- Reward statuses: `pending`, `paid`, `cancelled`

### 4. Referral Dashboard
- View referral statistics (total, successful, pending)
- Track earnings (total, paid, pending)
- See all referrals and their statuses
- View reward payment history
- Easy link sharing with copy and share buttons

## Database Schema

### Tables

#### `referral_codes`
Stores unique referral codes for each user.
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- referral_code: VARCHAR(20) (unique)
- created_at: TIMESTAMPTZ
```

#### `referrals`
Tracks who referred whom.
```sql
- id: UUID (primary key)
- referrer_id: UUID (references auth.users)
- referred_user_id: UUID (references auth.users)
- referral_code: VARCHAR(20)
- status: VARCHAR(50) (pending/subscribed/rewarded)
- referred_at: TIMESTAMPTZ
- subscribed_at: TIMESTAMPTZ
- rewarded_at: TIMESTAMPTZ
```

#### `referral_rewards`
Tracks rewards earned by referrers.
```sql
- id: UUID (primary key)
- referrer_id: UUID (references auth.users)
- referral_id: UUID (references referrals)
- amount: DECIMAL(10, 2) (default: 20000.00)
- status: VARCHAR(50) (pending/paid/cancelled)
- created_at: TIMESTAMPTZ
- paid_at: TIMESTAMPTZ
- payment_method: VARCHAR(50)
- payment_reference: VARCHAR(255)
```

#### `referral_stats`
Aggregated statistics for each user.
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- total_referrals: INTEGER
- successful_referrals: INTEGER
- pending_referrals: INTEGER
- total_earnings: DECIMAL(10, 2)
- paid_earnings: DECIMAL(10, 2)
- pending_earnings: DECIMAL(10, 2)
- updated_at: TIMESTAMPTZ
```

## Database Functions

### `generate_referral_code()`
Generates a unique 8-character alphanumeric code.

### `create_referral_code_for_user(p_user_id UUID)`
Creates a referral code for a user if they don't have one.

### `track_referral(p_referred_user_id UUID, p_referral_code VARCHAR)`
Records a referral relationship when someone signs up with a referral code.
- Validates the referral code exists
- Prevents self-referrals
- Prevents duplicate referrals
- Updates referrer's stats

### `process_referral_subscription(p_referred_user_id UUID)`
Processes the reward when a referred user subscribes.
- Updates referral status to 'subscribed'
- Creates a reward record (20,000)
- Updates referrer's earnings stats
- Marks referral as 'rewarded'

### `mark_reward_as_paid(p_reward_id UUID, p_payment_method VARCHAR, p_payment_reference VARCHAR)`
Marks a reward as paid and updates stats.

### `get_referral_stats(p_user_id UUID)`
Returns aggregated referral statistics for a user.

## Triggers

### `trigger_auto_create_referral_code`
Automatically creates a referral code when a new user signs up.

### `trigger_auto_process_referral_subscription`
Automatically processes referral rewards when a subscription is activated.

## Frontend Components

### `useReferral` Hook
Custom React hook for managing referral operations:
- `referralCode`: User's referral code
- `stats`: Referral statistics
- `referrals`: List of user's referrals
- `rewards`: List of user's rewards
- `trackReferral()`: Track a referral during signup
- `validateReferralCode()`: Validate a referral code
- `getReferralLink()`: Get the full referral URL
- `copyReferralLink()`: Copy referral link to clipboard
- `shareReferralLink()`: Share referral link via Web Share API

### `ReferralDashboard` Component
Full-featured dashboard at `/referrals` showing:
- Stats overview cards (total referrals, successful, earnings)
- Referral link with copy and share buttons
- Referral code display
- Tabs for viewing referrals and rewards
- Status badges for tracking progress

### Updated `Signup` Component
- Detects referral code from URL query parameter (`?ref=CODE`)
- Validates referral code
- Shows visual indicator for valid/invalid codes
- Tracks referral after successful signup

## User Flow

### For Referrers:
1. User logs in and navigates to `/referrals`
2. Views their unique referral code and link
3. Copies or shares the link with friends
4. Tracks referrals and earnings in the dashboard
5. Receives payment when rewards are marked as paid

### For Referred Users:
1. Clicks on referral link (e.g., `https://yoursite.com/auth/signup?ref=ABC123`)
2. Sees referral code indicator during signup
3. Completes registration
4. When they subscribe, referrer automatically earns 20,000

## Security

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can only view their own referral codes, stats, and rewards
- Referrers can only view their own referrals
- System functions use `SECURITY DEFINER` for controlled access

### Validation
- Referral codes are validated before tracking
- Self-referrals are prevented
- Duplicate referrals are prevented
- Only active subscriptions trigger rewards

## Payment Processing

Rewards are created automatically but require manual payment processing:

1. Admin queries pending rewards:
```sql
SELECT * FROM referral_rewards WHERE status = 'pending';
```

2. After payment is made, mark as paid:
```sql
SELECT mark_reward_as_paid(
  'reward-id',
  'mobile_money',
  'TXN123456'
);
```

## Integration Points

### Signup Flow
- `src/pages/auth/Signup.tsx`: Detects and validates referral codes
- Tracks referral after successful registration

### Subscription Flow
- Automatic trigger on `subscriptions` table insert
- Processes rewards when subscription becomes active

### Navigation
- Add link to `/referrals` in main navigation
- Accessible to both clients and providers

## Testing the System

### 1. Create a Referral Code
```sql
SELECT create_referral_code_for_user('user-id');
```

### 2. Test Referral Tracking
```sql
SELECT track_referral('referred-user-id', 'REFERRAL-CODE');
```

### 3. Simulate Subscription
```sql
INSERT INTO subscriptions (user_id, active, plan, amount, start_date, end_date)
VALUES ('referred-user-id', true, 'monthly', 100.00, NOW(), NOW() + INTERVAL '30 days');
```

### 4. Check Rewards
```sql
SELECT * FROM referral_rewards WHERE referrer_id = 'referrer-user-id';
```

## Future Enhancements

1. **Multi-tier Rewards**: Different reward amounts for different subscription plans
2. **Referral Leaderboard**: Gamification with top referrers
3. **Automated Payments**: Integration with payment gateways for automatic payouts
4. **Referral Campaigns**: Time-limited bonus rewards
5. **Social Sharing**: Pre-built social media share templates
6. **Email Notifications**: Notify referrers when they earn rewards
7. **Referral Analytics**: Detailed conversion tracking and metrics
8. **Minimum Threshold**: Require minimum earnings before payout
9. **Expiration**: Set expiration dates for referral codes or rewards
10. **Admin Dashboard**: Interface for managing and approving rewards

## Migration

Run the migration to set up the referral system:
```bash
# Apply the migration
supabase db push

# Or if using migrations
psql -d your_database -f supabase/migrations/20250112_referral_system.sql
```

## API Usage Examples

### Get User's Referral Code
```typescript
const { data } = await supabase
  .from('referral_codes')
  .select('*')
  .eq('user_id', userId)
  .single();
```

### Track a Referral
```typescript
const { data } = await supabase
  .rpc('track_referral', {
    p_referred_user_id: userId,
    p_referral_code: 'ABC123'
  });
```

### Get Referral Stats
```typescript
const { data } = await supabase
  .rpc('get_referral_stats', {
    p_user_id: userId
  });
```

## Support

For issues or questions about the referral system:
1. Check the database logs for errors
2. Verify RLS policies are correctly applied
3. Ensure triggers are active
4. Check that referral codes are being generated on signup
