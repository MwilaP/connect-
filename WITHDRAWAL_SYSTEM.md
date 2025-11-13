# Referral Withdrawal System

## Overview

The withdrawal system allows users to convert their referral points to cash and withdraw to mobile money. The system uses a points-based reward structure where **20,000 points = K20**.

---

## 💰 Points System

### Conversion Rate
```
20,000 points = K20
1,000 points = K1
10,000 points = K10 (minimum withdrawal)
```

### How It Works

1. **Earn Points**: Users earn 20,000 points for each successful referral
2. **Accumulate**: Points accumulate in their account
3. **Withdraw**: Convert points to cash (minimum 10,000 points)
4. **Receive**: Money sent to mobile money account

---

## 📊 Database Schema

### Updated `referral_rewards` Table

```sql
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id),
  referral_id UUID REFERENCES referrals(id),
  points INTEGER DEFAULT 20000,        -- Points earned
  amount DECIMAL(10, 2) DEFAULT 20.00, -- Cash equivalent
  status VARCHAR(50) DEFAULT 'pending', -- Status
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ
);
```

**Status Values:**
- `pending`: Reward created, awaiting approval
- `approved`: Available for withdrawal
- `withdrawn`: Points have been withdrawn
- `cancelled`: Reward cancelled

### New `withdrawal_requests` Table

```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  points INTEGER NOT NULL,                    -- Points being withdrawn
  amount DECIMAL(10, 2) NOT NULL,             -- Cash amount (points / 1000)
  payment_method VARCHAR(50) NOT NULL,        -- Mobile money provider
  phone_number VARCHAR(20) NOT NULL,          -- Recipient phone number
  status VARCHAR(50) DEFAULT 'pending',       -- Request status
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  transaction_reference VARCHAR(255),         -- Payment transaction ID
  admin_notes TEXT,                           -- Admin notes
  rejection_reason TEXT                       -- Reason if rejected
);
```

**Status Values:**
- `pending`: Request submitted, awaiting processing
- `processing`: Admin is processing the payment
- `completed`: Money sent successfully
- `rejected`: Request rejected

---

## 🔧 Database Functions

### 1. `get_withdrawal_balance(p_user_id UUID)`

Calculates the user's withdrawal balance.

**Returns:**
```sql
TABLE(
  total_points INTEGER,           -- Total points earned
  total_amount DECIMAL(10, 2),    -- Total cash equivalent
  withdrawn_points INTEGER,        -- Already withdrawn
  withdrawn_amount DECIMAL(10, 2), -- Already withdrawn cash
  pending_points INTEGER,          -- Pending withdrawal requests
  pending_amount DECIMAL(10, 2),   -- Pending cash
  available_points INTEGER,        -- Available to withdraw
  available_amount DECIMAL(10, 2)  -- Available cash
)
```

**Logic:**
- Sums all `approved` and `withdrawn` rewards
- Subtracts completed withdrawals
- Subtracts pending withdrawal requests
- Returns available balance

**Example:**
```sql
SELECT * FROM get_withdrawal_balance('user-uuid');
```

### 2. `create_withdrawal_request()`

Creates a new withdrawal request.

**Parameters:**
- `p_user_id UUID`: User requesting withdrawal
- `p_points INTEGER`: Points to withdraw
- `p_payment_method VARCHAR(50)`: Payment method
- `p_phone_number VARCHAR(20)`: Phone number

**Validations:**
- Minimum 10,000 points (K10)
- Sufficient available balance
- Valid payment method

**Returns:** `UUID` (request ID)

**Example:**
```sql
SELECT create_withdrawal_request(
  'user-uuid',
  20000,
  'airtel_money',
  '0977123456'
);
```

### 3. `process_withdrawal()`

Marks withdrawal as completed (admin only).

**Parameters:**
- `p_request_id UUID`: Withdrawal request ID
- `p_transaction_reference VARCHAR(255)`: Transaction ID
- `p_admin_notes TEXT`: Optional admin notes

**Returns:** `BOOLEAN` (success)

**Example:**
```sql
SELECT process_withdrawal(
  'request-uuid',
  'TXN123456789',
  'Sent via Airtel Money'
);
```

### 4. `reject_withdrawal()`

Rejects a withdrawal request (admin only).

**Parameters:**
- `p_request_id UUID`: Withdrawal request ID
- `p_rejection_reason TEXT`: Reason for rejection

**Returns:** `BOOLEAN` (success)

**Example:**
```sql
SELECT reject_withdrawal(
  'request-uuid',
  'Invalid phone number'
);
```

### 5. `mark_withdrawal_processing()`

Marks withdrawal as being processed (admin only).

**Parameters:**
- `p_request_id UUID`: Withdrawal request ID

**Returns:** `BOOLEAN` (success)

---

## 💻 Frontend Components

### 1. `WithdrawalRequestModal`

**Location:** `src/components/WithdrawalRequestModal.tsx`

**Features:**
- Shows current balance
- Points to cash conversion calculator
- Payment method selection
- Phone number input
- Validation (minimum 10,000 points)
- Success/error handling

**Props:**
```typescript
interface WithdrawalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Usage:**
```tsx
<WithdrawalRequestModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    refresh();
    toast({ title: 'Withdrawal requested!' });
  }}
/>
```

### 2. Updated `ReferralDashboard`

**New Features:**
- Withdrawal section with balance display
- "Withdraw to Mobile Money" button
- Points display with cash conversion
- Minimum balance warning

**Stats Cards:**
1. Total Referrals
2. Successful Referrals
3. Total Points (with K conversion)
4. Available to Withdraw

---

## 🎨 User Experience Flow

### User Withdrawal Flow

```
1. User earns points from referrals
   ↓
2. Points automatically approved
   ↓
3. User navigates to /referrals
   ↓
4. Sees available balance
   ↓
5. Clicks "Withdraw to Mobile Money"
   ↓
6. Modal opens showing:
   - Current balance
   - Conversion rate
   - Input for points amount
   - Payment method selection
   - Phone number input
   ↓
7. User enters details:
   - Points to withdraw (min 10,000)
   - Selects mobile money provider
   - Enters phone number
   ↓
8. Clicks "Request Withdrawal"
   ↓
9. System validates:
   - Sufficient balance
   - Minimum amount
   - Valid inputs
   ↓
10. Request created with status "pending"
    ↓
11. User sees success message
    ↓
12. Admin processes within 24-48 hours
    ↓
13. User receives money via mobile money
    ↓
14. Request status updated to "completed"
```

### Admin Processing Flow

```
1. Admin views withdrawal requests
   ↓
2. Sees pending requests with:
   - User details
   - Points/amount
   - Payment method
   - Phone number
   ↓
3. Marks as "processing"
   ↓
4. Initiates mobile money transfer
   ↓
5. Receives transaction reference
   ↓
6. Updates request:
   - Status: "completed"
   - Transaction reference
   - Admin notes
   ↓
7. User notified (optional SMS/email)
```

---

## 🔒 Security & Validation

### Request Validation

**Client-Side:**
- Minimum 10,000 points
- Valid phone number format
- Payment method selected
- Sufficient balance check

**Server-Side:**
- User authentication
- Balance verification
- Duplicate request prevention
- SQL injection protection
- RLS policies enforced

### Row Level Security

```sql
-- Users can view their own requests
CREATE POLICY "Users can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create requests
CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update
CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );
```

---

## 📱 Mobile Money Integration

### Supported Providers

1. **Airtel Money**
2. **MTN Money**
3. **Zamtel Money**

### Integration Steps

To integrate with actual mobile money APIs:

#### 1. Airtel Money API

```typescript
async function sendAirtelMoney(phoneNumber: string, amount: number) {
  const response = await fetch('https://api.airtel.com/merchant/v1/payments/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTEL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference: `WD-${Date.now()}`,
      subscriber: {
        country: 'ZM',
        currency: 'ZMW',
        msisdn: phoneNumber,
      },
      transaction: {
        amount: amount,
        country: 'ZM',
        currency: 'ZMW',
        id: `WD-${Date.now()}`,
      },
    }),
  });
  
  const data = await response.json();
  return data.transaction.id;
}
```

#### 2. MTN Money API

```typescript
async function sendMTNMoney(phoneNumber: string, amount: number) {
  // Similar implementation for MTN
  // Use MTN MoMo API
}
```

#### 3. Zamtel Money API

```typescript
async function sendZamtelMoney(phoneNumber: string, amount: number) {
  // Similar implementation for Zamtel
}
```

### Admin Processing with API

```typescript
async function processWithdrawalWithAPI(requestId: string) {
  // 1. Get withdrawal request
  const { data: request } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  
  // 2. Send money via API
  let transactionRef;
  switch (request.payment_method) {
    case 'airtel_money':
      transactionRef = await sendAirtelMoney(request.phone_number, request.amount);
      break;
    case 'mtn_money':
      transactionRef = await sendMTNMoney(request.phone_number, request.amount);
      break;
    case 'zamtel_money':
      transactionRef = await sendZamtelMoney(request.phone_number, request.amount);
      break;
  }
  
  // 3. Update request
  await supabase.rpc('process_withdrawal', {
    p_request_id: requestId,
    p_transaction_reference: transactionRef,
    p_admin_notes: 'Processed automatically',
  });
}
```

---

## 🧪 Testing

### Test Withdrawal Flow

1. **Create test user with points**
```sql
-- Give user some approved rewards
INSERT INTO referral_rewards (referrer_id, referral_id, points, amount, status)
VALUES ('user-uuid', 'referral-uuid', 20000, 20.00, 'approved');
```

2. **Check balance**
```sql
SELECT * FROM get_withdrawal_balance('user-uuid');
-- Should show 20000 available points
```

3. **Create withdrawal request**
```sql
SELECT create_withdrawal_request(
  'user-uuid',
  20000,
  'airtel_money',
  '0977123456'
);
```

4. **Verify request created**
```sql
SELECT * FROM withdrawal_requests WHERE user_id = 'user-uuid';
```

5. **Process withdrawal**
```sql
SELECT process_withdrawal(
  'request-uuid',
  'TEST-TXN-123',
  'Test processing'
);
```

6. **Verify completion**
```sql
SELECT * FROM withdrawal_requests WHERE id = 'request-uuid';
-- Status should be 'completed'
```

### Test Edge Cases

**Insufficient Balance:**
```sql
SELECT create_withdrawal_request(
  'user-uuid',
  100000, -- More than available
  'airtel_money',
  '0977123456'
);
-- Should raise exception
```

**Below Minimum:**
```sql
SELECT create_withdrawal_request(
  'user-uuid',
  5000, -- Less than 10,000 minimum
  'airtel_money',
  '0977123456'
);
-- Should raise exception
```

---

## 📊 Admin Queries

### View All Pending Withdrawals

```sql
SELECT 
  wr.*,
  u.email,
  u.raw_user_meta_data->>'role' as user_role
FROM withdrawal_requests wr
JOIN auth.users u ON u.id = wr.user_id
WHERE wr.status = 'pending'
ORDER BY wr.created_at ASC;
```

### View Withdrawal Statistics

```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(points) as total_points,
  SUM(amount) as total_amount
FROM withdrawal_requests
GROUP BY status;
```

### View User Withdrawal History

```sql
SELECT 
  wr.*,
  rr.points as reward_points
FROM withdrawal_requests wr
LEFT JOIN referral_rewards rr ON rr.referrer_id = wr.user_id
WHERE wr.user_id = 'user-uuid'
ORDER BY wr.created_at DESC;
```

---

## 🚨 Important Notes

### For Users

- **Minimum Withdrawal:** 10,000 points (K10)
- **Processing Time:** 24-48 hours
- **Phone Number:** Must be correct and active
- **Conversion Rate:** Fixed at 1,000 points = K1
- **Pending Requests:** Cannot withdraw points in pending requests

### For Admins

- **Verify Phone Numbers:** Always verify before sending
- **Transaction References:** Must be recorded
- **Processing Order:** First-come, first-served
- **Rejection Reasons:** Must be clear and specific
- **Audit Trail:** All actions are logged

### System Limits

- **Minimum Withdrawal:** 10,000 points (K10)
- **Maximum Withdrawal:** No limit (based on available balance)
- **Daily Limit:** None (can be added if needed)
- **Pending Requests:** No limit per user

---

## 📜 Withdrawal History Tracking

### Overview

Users can now track all their withdrawal requests in a dedicated "Withdrawals" tab on the referral dashboard.

### Features

**1. Withdrawal Statistics:**
- Total withdrawal requests
- Completed withdrawals count
- Pending withdrawals count
- Total amount withdrawn (in Kwacha)

**2. Detailed Withdrawal Cards:**
Each withdrawal displays:
- Amount (in Kwacha and points)
- Status badge (Pending, Processing, Completed, Rejected)
- Payment method
- Phone number
- Request date
- Completion date (if completed)
- Transaction reference (if completed)
- Rejection reason (if rejected)

**3. Status Indicators:**
- 🟢 **Completed:** Green badge with checkmark
- 🔵 **Processing:** Blue badge with spinner
- 🟡 **Pending:** Yellow badge with clock
- 🔴 **Rejected:** Red badge with X

**4. Real-time Updates:**
- Automatically fetches latest withdrawal data
- Shows processing timeline
- Displays helpful status messages

### Component Location

**File:** `src/components/WithdrawalHistory.tsx`

**Usage:**
```tsx
import { WithdrawalHistory } from '../components/WithdrawalHistory';

// In your component
<WithdrawalHistory />
```

### Integration

The withdrawal history is integrated into the Referral Dashboard as a tab:

**Navigation:**
```
/referrals → Tabs: My Referrals | My Rewards | Withdrawals
```

**Tab Content:**
- Statistics cards at the top
- List of all withdrawal requests below
- Empty state for users with no withdrawals

### User Experience

**For Users with Withdrawals:**
1. Navigate to `/referrals`
2. Click "Withdrawals" tab
3. See statistics overview
4. Scroll through withdrawal history
5. Check status of each request
6. View transaction references for completed withdrawals

**For Users without Withdrawals:**
1. Navigate to `/referrals`
2. Click "Withdrawals" tab
3. See empty state with helpful message
4. Encouraged to make first withdrawal

### Data Fetching

The component fetches data directly from the `withdrawal_requests` table using Supabase:

```typescript
const { data } = await supabase
  .from('withdrawal_requests')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

**RLS Policies ensure:**
- Users only see their own withdrawals
- Admins can see all withdrawals
- Secure data access

---

## 🔮 Future Enhancements

### Potential Features

1. **Automatic Processing:** API integration for instant withdrawals
2. **Email Notifications:** Notify users of status changes
4. **SMS Confirmations:** Send SMS when money is sent
5. **Withdrawal Limits:** Daily/weekly limits for security
6. **Bank Transfers:** Add bank transfer option
7. **Withdrawal Fees:** Optional processing fees
8. **Batch Processing:** Process multiple withdrawals at once
9. **Scheduled Withdrawals:** Set up recurring withdrawals
10. **Tax Reporting:** Generate tax documents for earnings

---

## ✅ Summary

The withdrawal system provides:

- ✅ Points-based rewards (20,000 points = K20)
- ✅ Mobile money withdrawals
- ✅ Minimum withdrawal of K10
- ✅ Admin approval workflow
- ✅ Balance tracking and validation
- ✅ Secure RLS policies
- ✅ Complete audit trail
- ✅ User-friendly interface
- ✅ Multiple payment methods
- ✅ Processing status tracking

Users can now easily convert their referral points to cash and receive payments directly to their mobile money accounts! 🎉
