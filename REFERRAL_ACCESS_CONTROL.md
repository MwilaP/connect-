# Referral Program Access Control

## Overview

The referral program now has access restrictions to ensure only eligible users can participate:

- **Clients**: Must have an active subscription to access the referral program
- **Providers**: Must pay a one-time fee of K30 to unlock lifetime access

---

## 🔐 Access Requirements

### For Clients

**Requirement:** Active subscription

**Benefits:**
- Access to referral program while subscription is active
- Earn K20,000 for each successful referral
- Automatic access upon subscription
- Access removed if subscription expires

**How to Get Access:**
1. Navigate to `/client/subscription`
2. Subscribe to any plan (K100/month)
3. Referral program automatically unlocked
4. Access `/referrals` to start sharing

### For Providers

**Requirement:** One-time payment of K30

**Benefits:**
- Lifetime access to referral program
- Earn K20,000 for each successful referral
- Unlimited referral link sharing
- No recurring fees

**How to Get Access:**
1. Navigate to `/referrals`
2. Click "Pay K30 to Unlock"
3. Complete payment via:
   - Airtel Money
   - MTN Money
   - Zamtel Money
   - Bank Transfer
4. Instant access after payment confirmation

---

## 📊 Database Schema

### New Table: `provider_referral_access`

Tracks provider payments for referral program access.

```sql
CREATE TABLE provider_referral_access (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10, 2) DEFAULT 30.00,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  status VARCHAR(50) DEFAULT 'paid',
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = lifetime
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Fields:**
- `user_id`: Provider's user ID
- `amount`: Payment amount (K30)
- `payment_method`: Payment method used
- `payment_reference`: Transaction reference
- `status`: 'paid' or 'refunded'
- `expires_at`: NULL for lifetime access

---

## 🔧 Database Functions

### 1. `check_referral_access(p_user_id UUID)`

Checks if a user has access to the referral program.

**Returns:**
```sql
TABLE(
  has_access BOOLEAN,
  access_type VARCHAR(50), -- 'subscription', 'payment', 'none'
  message TEXT
)
```

**Logic:**
- **Clients**: Checks for active subscription
- **Providers**: Checks for paid access record
- Returns access status and appropriate message

**Example:**
```sql
SELECT * FROM check_referral_access('user-uuid-here');
```

### 2. `grant_provider_referral_access(p_user_id, p_payment_method, p_payment_reference)`

Grants referral access to a provider after payment.

**Parameters:**
- `p_user_id`: Provider's user ID
- `p_payment_method`: Payment method used
- `p_payment_reference`: Transaction reference

**Actions:**
1. Creates/updates access record
2. Automatically creates referral code
3. Returns access ID

**Example:**
```sql
SELECT grant_provider_referral_access(
  'user-uuid',
  'airtel_money',
  'TXN123456'
);
```

---

## 💻 Frontend Implementation

### 1. Updated `useReferral` Hook

**New Export:**
```typescript
export interface ReferralAccess {
  hasAccess: boolean;
  accessType: 'subscription' | 'payment' | 'none';
  message: string;
}
```

**New Return Value:**
```typescript
{
  access: ReferralAccess | null,
  // ... other values
}
```

**Usage:**
```typescript
const { access, loading } = useReferral();

if (!loading && access && !access.hasAccess) {
  // Show access restriction UI
}
```

### 2. `ReferralAccessPaymentModal` Component

**Location:** `src/components/ReferralAccessPaymentModal.tsx`

**Props:**
```typescript
interface ReferralAccessPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Features:**
- Payment method selection
- Phone number input
- Transaction ID field
- Payment processing
- Success confirmation
- Error handling

**Usage:**
```tsx
<ReferralAccessPaymentModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    refresh();
    toast({ title: 'Access granted!' });
  }}
/>
```

### 3. Updated `ReferralDashboard`

**Access Check:**
- Displays lock screen for users without access
- Shows appropriate call-to-action:
  - **Clients**: Link to subscription page
  - **Providers**: Payment button
- Hides referral content until access granted

**UI States:**
1. **Loading**: Shows loading screen
2. **No Access**: Shows unlock/subscribe prompt
3. **Has Access**: Shows full referral dashboard

---

## 🎨 User Experience Flow

### Client Flow

```
1. Client visits /referrals
   ↓
2. System checks subscription status
   ↓
3a. Has subscription → Show referral dashboard
3b. No subscription → Show "Subscribe to Access" card
   ↓
4. Click "View Subscription Plans"
   ↓
5. Navigate to /client/subscription
   ↓
6. Subscribe to plan
   ↓
7. Return to /referrals → Access granted
```

### Provider Flow

```
1. Provider visits /referrals
   ↓
2. System checks payment status
   ↓
3a. Has paid → Show referral dashboard
3b. Not paid → Show "Pay K30 to Unlock" card
   ↓
4. Click "Pay K30 to Unlock"
   ↓
5. Payment modal opens
   ↓
6. Select payment method
   ↓
7. Enter phone number
   ↓
8. Complete payment
   ↓
9. Access granted → Show referral dashboard
```

---

## 🔒 Security & Permissions

### Row Level Security (RLS)

**Policies on `provider_referral_access`:**

1. **Users can view their own access:**
   ```sql
   CREATE POLICY "Users can view their own referral access"
     ON provider_referral_access FOR SELECT
     USING (auth.uid() = user_id);
   ```

2. **Admins can view all access:**
   ```sql
   CREATE POLICY "Admins can view all referral access"
     ON provider_referral_access FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM auth.users
         WHERE id = auth.uid()
         AND raw_user_meta_data->>'role' = 'admin'
       )
     );
   ```

3. **Admins can grant access:**
   ```sql
   CREATE POLICY "Admins can insert referral access"
     ON provider_referral_access FOR INSERT
     WITH CHECK (
       EXISTS (
         SELECT 1 FROM auth.users
         WHERE id = auth.uid()
         AND raw_user_meta_data->>'role' = 'admin'
       )
     );
   ```

### Function Security

All functions use `SECURITY DEFINER` to ensure:
- Proper permission checks
- Consistent access control
- Protection against unauthorized access

---

## 💰 Payment Integration

### Current Implementation

The payment modal provides a framework for payment integration. To connect to a real payment provider:

### 1. **Mobile Money Integration**

**For Airtel Money, MTN Money, Zamtel Money:**

```typescript
// In ReferralAccessPaymentModal.tsx
const initiatePayment = async () => {
  // Call your payment gateway API
  const response = await fetch('/api/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({
      amount: 30,
      phone: phoneNumber,
      method: paymentMethod,
    }),
  });
  
  const { transactionId } = await response.json();
  
  // Poll for payment confirmation
  await pollPaymentStatus(transactionId);
  
  // Grant access after confirmation
  await grantAccess(transactionId);
};
```

### 2. **Bank Transfer**

For bank transfers, you might:
1. Show bank details to user
2. User makes transfer
3. User enters transaction reference
4. Admin verifies and approves manually

### 3. **Webhook Integration**

Set up webhooks to receive payment confirmations:

```typescript
// api/webhooks/payment-confirmation
export async function POST(req: Request) {
  const { userId, transactionId, status } = await req.json();
  
  if (status === 'success') {
    await supabase.rpc('grant_provider_referral_access', {
      p_user_id: userId,
      p_payment_method: 'mobile_money',
      p_payment_reference: transactionId,
    });
  }
}
```

---

## 🧪 Testing

### Test Client Access

1. **Create test client account**
2. **Visit `/referrals`** → Should see "Subscribe to Access"
3. **Subscribe via `/client/subscription`**
4. **Return to `/referrals`** → Should see full dashboard
5. **Cancel subscription**
6. **Return to `/referrals`** → Should see access denied

### Test Provider Access

1. **Create test provider account**
2. **Visit `/referrals`** → Should see "Pay K30 to Unlock"
3. **Click payment button**
4. **Complete payment flow**
5. **Should see full dashboard**
6. **Refresh page** → Access should persist

### Test Access Check Function

```sql
-- Test client without subscription
SELECT * FROM check_referral_access('client-user-id');
-- Expected: has_access = false, access_type = 'none'

-- Test client with subscription
SELECT * FROM check_referral_access('subscribed-client-id');
-- Expected: has_access = true, access_type = 'subscription'

-- Test provider without payment
SELECT * FROM check_referral_access('provider-user-id');
-- Expected: has_access = false, access_type = 'none'

-- Test provider with payment
SELECT * FROM check_referral_access('paid-provider-id');
-- Expected: has_access = true, access_type = 'payment'
```

---

## 📈 Admin Management

### View All Provider Access Records

```sql
SELECT 
  pra.*,
  u.email,
  u.raw_user_meta_data->>'role' as role
FROM provider_referral_access pra
JOIN auth.users u ON u.id = pra.user_id
ORDER BY pra.created_at DESC;
```

### Manually Grant Access

```sql
SELECT grant_provider_referral_access(
  'provider-user-id',
  'manual_grant',
  'ADMIN-GRANTED-' || NOW()::TEXT
);
```

### Refund Access (if needed)

```sql
UPDATE provider_referral_access
SET status = 'refunded'
WHERE user_id = 'provider-user-id';
```

---

## 🔄 Migration Steps

### 1. Run the Migration

```bash
# Apply the updated referral system migration
supabase db push
```

Or manually run:
```bash
psql -d your_database -f supabase/migrations/20250112_referral_system.sql
```

### 2. Verify Tables

```sql
-- Check table exists
\d provider_referral_access

-- Check functions exist
\df check_referral_access
\df grant_provider_referral_access
```

### 3. Test Access Control

```sql
-- Test with a real user ID
SELECT * FROM check_referral_access('your-test-user-id');
```

---

## 🎯 Key Benefits

### For the Platform

1. **Revenue Generation**: K30 per provider for referral access
2. **Subscription Incentive**: Encourages client subscriptions
3. **Quality Control**: Only committed users participate
4. **Reduced Spam**: Payment barrier prevents abuse

### For Users

1. **Clear Value**: Pay once, earn unlimited rewards
2. **Fair Access**: Subscribers get included benefit
3. **Transparent**: Clear requirements and benefits
4. **Profitable**: K20,000 per referral >> K30 access fee

---

## 🚨 Important Notes

### Client Subscriptions

- Access is tied to active subscription status
- If subscription expires, referral access is removed
- Existing referrals and rewards remain valid
- Access restored when subscription renewed

### Provider Payments

- One-time payment for lifetime access
- No recurring fees
- Access persists even if provider becomes inactive
- Refunds can be issued by updating status to 'refunded'

### Referral Rewards

- Users without access cannot generate referral codes
- Existing referrals remain valid even if access removed
- Rewards are still paid out for past referrals
- New referrals cannot be tracked without access

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Client has subscription but no access
**Solution**: Check subscription status and end_date
```sql
SELECT * FROM subscriptions 
WHERE user_id = 'client-id' 
AND status = 'active' 
AND end_date > NOW();
```

**Issue**: Provider paid but no access
**Solution**: Check payment record
```sql
SELECT * FROM provider_referral_access 
WHERE user_id = 'provider-id';
```

**Issue**: Access check returns error
**Solution**: Verify user role is set correctly
```sql
SELECT raw_user_meta_data->>'role' 
FROM auth.users 
WHERE id = 'user-id';
```

---

## 🔮 Future Enhancements

### Potential Features

1. **Tiered Pricing**: Different access levels with different rewards
2. **Promotional Periods**: Temporary free access campaigns
3. **Bulk Discounts**: Reduced rates for multiple providers
4. **Subscription Bundles**: Include referral access in premium plans
5. **Performance Bonuses**: Extra rewards for top referrers
6. **Expiring Access**: Time-limited access for providers
7. **Referral Contests**: Competitions with prizes
8. **Team Referrals**: Group referral programs

---

## 📊 Analytics & Reporting

### Track Access Metrics

```sql
-- Total providers with access
SELECT COUNT(*) FROM provider_referral_access WHERE status = 'paid';

-- Total revenue from provider access
SELECT SUM(amount) FROM provider_referral_access WHERE status = 'paid';

-- Clients with referral access (active subscriptions)
SELECT COUNT(DISTINCT user_id) 
FROM subscriptions 
WHERE status = 'active' 
AND end_date > NOW()
AND user_id IN (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'role' = 'client'
);

-- Access conversion rate
SELECT 
  COUNT(*) FILTER (WHERE status = 'paid') * 100.0 / COUNT(*) as conversion_rate
FROM provider_referral_access;
```

---

## ✅ Summary

The referral program now has robust access control:

- ✅ Clients need active subscriptions
- ✅ Providers pay K30 for lifetime access
- ✅ Database functions check eligibility
- ✅ UI shows appropriate prompts
- ✅ Payment modal for providers
- ✅ Secure RLS policies
- ✅ Admin management capabilities
- ✅ Clear user experience flows

This creates a sustainable referral program that generates revenue while incentivizing subscriptions and ensuring only committed users participate.
