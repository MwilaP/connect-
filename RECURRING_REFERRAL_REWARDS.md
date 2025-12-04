# Recurring Referral Rewards System

## 🎯 Overview

The referral system now supports **recurring rewards**. This means:

- **Before:** Referrer earns K20 only when their friend subscribes for the first time
- **After:** Referrer earns K20 **EVERY TIME** their friend subscribes (including renewals)

---

## 💰 How It Works

### Example Scenario

**John refers Sarah:**

1. **Month 1:** Sarah subscribes → John earns **K20** ✅
2. **Month 2:** Sarah renews subscription → John earns **K20** ✅
3. **Month 3:** Sarah renews subscription → John earns **K20** ✅
4. **Month 4:** Sarah renews subscription → John earns **K20** ✅

**Total:** John earns K20 every single month Sarah stays subscribed!

---

## 🔄 Reward Triggers

### When Rewards Are Created

Rewards are automatically created when:

1. **New Subscription**
   - User subscribes for the first time
   - Referrer gets K20

2. **Subscription Renewal**
   - User renews their subscription
   - Referrer gets another K20

3. **Subscription Reactivation**
   - User's subscription expired and they reactivate
   - Referrer gets K20 again

### When Rewards Are NOT Created

- Subscription is inactive
- Same subscription already rewarded (prevents duplicates)
- No referral relationship exists

---

## 📊 Database Changes

### New Column: `subscription_id`

Added to `referral_rewards` table:

```sql
ALTER TABLE referral_rewards 
ADD COLUMN subscription_id UUID REFERENCES subscriptions(id);
```

**Purpose:** Links each reward to a specific subscription payment, preventing duplicate rewards for the same subscription.

### Updated Trigger

**Old Trigger:**
```sql
-- Only fired on INSERT (new subscriptions)
CREATE TRIGGER trigger_auto_process_referral_subscription
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_process_referral_subscription();
```

**New Trigger:**
```sql
-- Fires on both INSERT and UPDATE (new + renewals)
CREATE TRIGGER trigger_auto_process_referral_subscription
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_process_referral_subscription();
```

### Updated Function Logic

The `process_referral_subscription()` function now:

1. ✅ Checks if reward already exists for this specific subscription
2. ✅ Creates reward for each unique subscription
3. ✅ Updates stats correctly for recurring rewards
4. ✅ Prevents duplicate rewards

---

## 🎨 User Experience

### For Referrers

**Dashboard Display:**

```
Total Earnings: K80 (4 rewards)
├── Sarah's subscription (Month 1): K20
├── Sarah's subscription (Month 2): K20
├── Sarah's subscription (Month 3): K20
└── Sarah's subscription (Month 4): K20
```

**Rewards Tab:**
- Each subscription payment appears as a separate reward
- All rewards are automatically approved
- Can withdraw accumulated earnings anytime

### For Referred Users

**No Change:**
- Subscribe normally
- Pay subscription fee
- Referrer automatically gets rewarded
- No extra cost or action needed

---

## 📈 Statistics Updates

### Referrer Stats

**`referral_stats` table updates:**

```sql
-- First subscription
successful_referrals: +1 (counted once)
total_earnings: +20000 points

-- Each renewal
successful_referrals: no change (already counted)
total_earnings: +20000 points (keeps increasing)
```

**Example:**
```
User has 1 successful referral (Sarah)
Sarah subscribes 4 times
Stats show:
- Successful Referrals: 1
- Total Earnings: K80 (4 × K20)
```

---

## 🔍 Tracking Rewards

### New Helper Function

```sql
get_referral_reward_count(referrer_id, referred_user_id)
```

**Returns:** Number of times a referrer has been rewarded for a specific referral

**Example:**
```sql
SELECT get_referral_reward_count(
  'john-uuid',
  'sarah-uuid'
);
-- Returns: 4 (if Sarah subscribed 4 times)
```

---

## 🛡️ Duplicate Prevention

### How It Works

1. **Subscription Created/Updated**
   - Trigger fires
   - Function checks: "Did we already reward for this subscription_id?"
   - If yes: Skip (no duplicate)
   - If no: Create reward

2. **Database Constraint**
   - Each reward linked to specific `subscription_id`
   - Same subscription can't be rewarded twice

### Example

```sql
-- Sarah's first subscription (id: sub-123)
INSERT INTO subscriptions (id, user_id, active) 
VALUES ('sub-123', 'sarah-uuid', true);
-- ✅ Reward created: referral_rewards.subscription_id = 'sub-123'

-- Sarah's subscription updated (same id: sub-123)
UPDATE subscriptions 
SET end_date = '2025-03-01' 
WHERE id = 'sub-123';
-- ❌ No reward: subscription_id 'sub-123' already rewarded

-- Sarah's new subscription (id: sub-456)
INSERT INTO subscriptions (id, user_id, active) 
VALUES ('sub-456', 'sarah-uuid', true);
-- ✅ Reward created: referral_rewards.subscription_id = 'sub-456'
```

---

## 💡 Business Benefits

### For Platform

1. **Increased Retention**
   - Referrers motivated to keep referred users active
   - Ongoing incentive to help friends stay subscribed

2. **Viral Growth**
   - More attractive referral program
   - "Earn K20 every month your friend subscribes!"

3. **Long-term Value**
   - Rewards scale with customer lifetime value
   - Better ROI on referral program

### For Users

1. **Passive Income**
   - Earn money every month
   - No extra work after initial referral

2. **Compound Earnings**
   - Multiple referrals = multiple recurring rewards
   - Example: 5 friends × K20/month = K100/month

3. **Fair Rewards**
   - Rewarded for ongoing value brought to platform
   - Not just one-time bonus

---

## 📊 Example Calculations

### Scenario 1: Single Referral

**John refers Sarah:**
- Month 1: K20
- Month 2: K20
- Month 3: K20
- **Total after 3 months: K60**

### Scenario 2: Multiple Referrals

**John refers 3 friends:**

**Sarah (subscribes 3 months):**
- Month 1: K20
- Month 2: K20
- Month 3: K20
- Subtotal: K60

**Mike (subscribes 2 months):**
- Month 1: K20
- Month 2: K20
- Subtotal: K40

**Lisa (subscribes 4 months):**
- Month 1: K20
- Month 2: K20
- Month 3: K20
- Month 4: K20
- Subtotal: K80

**John's Total: K180** (from 3 referrals over 4 months)

### Scenario 3: Long-term Earnings

**John refers 10 friends, each stays for 6 months:**
- 10 friends × K20/month × 6 months = **K1,200**

---

## 🔧 Migration Instructions

### Apply Migration

**File:** `supabase/migrations/20250204_recurring_referral_rewards.sql`

**Steps:**

1. **Using Supabase CLI:**
```bash
supabase db push
```

2. **Using Supabase Dashboard:**
   - Go to SQL Editor
   - Copy migration file content
   - Run migration

3. **Verify:**
```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'referral_rewards' 
AND column_name = 'subscription_id';

-- Check if trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_process_referral_subscription';
```

---

## 🧪 Testing

### Test Recurring Rewards

1. **Create Test Users:**
```sql
-- Referrer: John
-- Referred: Sarah (with referral relationship)
```

2. **First Subscription:**
```sql
INSERT INTO subscriptions (user_id, active, plan, amount)
VALUES ('sarah-uuid', true, 'monthly', 100.00);

-- Check: John should have 1 reward of K20
SELECT * FROM referral_rewards WHERE referrer_id = 'john-uuid';
```

3. **Second Subscription (Renewal):**
```sql
INSERT INTO subscriptions (user_id, active, plan, amount)
VALUES ('sarah-uuid', true, 'monthly', 100.00);

-- Check: John should now have 2 rewards of K20 each
SELECT * FROM referral_rewards WHERE referrer_id = 'john-uuid';
```

4. **Verify Stats:**
```sql
SELECT * FROM referral_stats WHERE user_id = 'john-uuid';
-- Should show:
-- successful_referrals: 1
-- total_earnings: 40000 (2 × 20000)
```

---

## 📱 UI Updates Needed

### ReferralDashboard

**Current Display:**
```
Total Earnings: K40
Successful Referrals: 2
```

**Suggested Enhancement:**
```
Total Earnings: K40
Successful Referrals: 1 (2 subscription payments)
```

### Rewards Tab

**Current:**
- Shows rewards with referral name

**Suggested Enhancement:**
- Show subscription date/month
- Group by referral with count
- Example: "Sarah (3 subscriptions) - K60"

### Example UI Code:

```tsx
// Group rewards by referral
const groupedRewards = rewards.reduce((acc, reward) => {
  const key = reward.referral_id;
  if (!acc[key]) {
    acc[key] = {
      referralName: reward.referral_name,
      count: 0,
      totalAmount: 0,
      rewards: []
    };
  }
  acc[key].count++;
  acc[key].totalAmount += reward.amount;
  acc[key].rewards.push(reward);
  return acc;
}, {});

// Display
{Object.values(groupedRewards).map(group => (
  <div>
    <h3>{group.referralName}</h3>
    <p>{group.count} subscription payments</p>
    <p>Total: K{group.totalAmount}</p>
  </div>
))}
```

---

## ⚠️ Important Notes

### Backward Compatibility

✅ **Existing rewards are preserved**
- Old rewards without `subscription_id` remain valid
- New rewards will have `subscription_id`
- Both types work in withdrawal system

### Subscription Tracking

⚠️ **Important:** Ensure subscriptions are properly tracked
- Each renewal should create a new subscription record OR
- Update existing subscription with proper triggers

### Performance

✅ **Optimized for scale**
- Index on `subscription_id` for fast lookups
- Efficient duplicate checking
- No performance impact on existing queries

---

## 🎉 Summary

### What Changed

- ✅ Referrers earn K20 for EVERY subscription (not just first)
- ✅ Rewards linked to specific subscriptions
- ✅ Duplicate prevention built-in
- ✅ Stats updated correctly
- ✅ Backward compatible

### Benefits

- 💰 More earnings for referrers
- 🔄 Recurring passive income
- 📈 Better retention incentive
- 🎯 Fair reward system
- 🚀 More attractive referral program

### Migration Required

- 📄 Apply: `20250204_recurring_referral_rewards.sql`
- ⏱️ Downtime: None
- 🔄 Rollback: Available if needed

---

**The referral system is now even more powerful! Referrers earn K20 every single time their friends subscribe. 🎉**
