# Referral System Setup Guide

## Quick Start

### 1. Apply Database Migration

Run the referral system migration to create all necessary tables and functions:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration file directly
psql -d your_database -f supabase/migrations/20250112_referral_system.sql
```

### 2. Verify Database Setup

Check that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'referral%';
```

You should see:
- `referral_codes`
- `referrals`
- `referral_rewards`
- `referral_stats`

### 3. Test Referral Code Generation

Existing users won't have referral codes yet. You can generate them manually:

```sql
-- Generate code for a specific user
SELECT create_referral_code_for_user('user-id-here');

-- Or generate for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM create_referral_code_for_user(user_record.id);
  END LOOP;
END $$;
```

### 4. Add Navigation Links

Add a link to the referral dashboard in your navigation components:

**For Client Navigation:**
```tsx
<Link to="/referrals">Referral Program</Link>
```

**For Provider Navigation:**
```tsx
<Link to="/referrals">Referral Program</Link>
```

### 5. Configure Environment (Optional)

If you want to customize the reward amount, you can modify it in the migration file before applying:

```sql
-- Change from 20000.00 to your desired amount
amount DECIMAL(10, 2) DEFAULT 20000.00
```

## Testing the System

### Test Flow 1: Complete Referral Journey

1. **Get a referral link:**
   - Log in as User A
   - Go to `/referrals`
   - Copy the referral link (e.g., `https://yoursite.com/auth/signup?ref=ABC123`)

2. **Sign up with referral:**
   - Log out
   - Visit the referral link
   - Sign up as User B
   - Verify you see the referral code indicator

3. **Trigger reward:**
   - As User B, subscribe to any plan
   - Check User A's referral dashboard
   - Verify the reward appears as pending

4. **Process payment (Admin):**
   - Access admin panel at `/admin/referral-rewards`
   - Mark the reward as paid
   - Enter payment details

### Test Flow 2: Database Functions

```sql
-- 1. Create a test user referral code
SELECT create_referral_code_for_user('test-user-id');

-- 2. Track a referral
SELECT track_referral('referred-user-id', 'ABC123');

-- 3. Simulate subscription (triggers reward automatically)
INSERT INTO subscriptions (user_id, active, plan, amount, start_date, end_date)
VALUES ('referred-user-id', true, 'monthly', 100.00, NOW(), NOW() + INTERVAL '30 days');

-- 4. Check the reward was created
SELECT * FROM referral_rewards WHERE referrer_id = 'test-user-id';

-- 5. Check stats were updated
SELECT * FROM referral_stats WHERE user_id = 'test-user-id';
```

## Common Issues & Solutions

### Issue: Referral codes not generated for existing users

**Solution:** Run the bulk generation script:
```sql
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM create_referral_code_for_user(user_record.id);
  END LOOP;
END $$;
```

### Issue: Rewards not created when user subscribes

**Solution:** Check that the trigger is active:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_process_referral_subscription';
```

If missing, recreate it:
```sql
CREATE TRIGGER trigger_auto_process_referral_subscription
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_process_referral_subscription();
```

### Issue: RLS policies blocking access

**Solution:** Verify policies are correctly set:
```sql
SELECT * FROM pg_policies WHERE tablename LIKE 'referral%';
```

### Issue: Admin can't access reward management

**Solution:** The admin component uses `supabase.auth.admin.getUserById()` which requires service role key. For production, create a server-side API endpoint or use a different approach to fetch user emails.

## Production Checklist

- [ ] Database migration applied successfully
- [ ] All triggers are active
- [ ] RLS policies are enabled and tested
- [ ] Referral codes generated for existing users
- [ ] Navigation links added to UI
- [ ] Test complete referral flow end-to-end
- [ ] Admin panel access configured
- [ ] Payment processing workflow established
- [ ] Email notifications configured (optional)
- [ ] Analytics tracking set up (optional)

## Customization Options

### Change Reward Amount

Edit the migration file before applying:
```sql
-- In referral_rewards table
amount DECIMAL(10, 2) DEFAULT 20000.00  -- Change this value

-- In process_referral_subscription function
INSERT INTO referral_rewards (referrer_id, referral_id, amount)
VALUES (v_referral_record.referrer_id, v_referral_record.id, 20000.00);  -- And here
```

### Add Referral Code Prefix

Modify the `generate_referral_code()` function:
```sql
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Add prefix 'REF-' to codes
    new_code := 'REF-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```

### Add Expiration to Referral Codes

Add an expiration column:
```sql
ALTER TABLE referral_codes ADD COLUMN expires_at TIMESTAMPTZ;

-- Update validation to check expiration
CREATE OR REPLACE FUNCTION track_referral(p_referred_user_id UUID, p_referral_code VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT user_id, expires_at INTO v_referrer_id, v_expires_at 
  FROM referral_codes 
  WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check expiration
  IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
    RETURN false;
  END IF;
  
  -- Rest of the function...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Monitoring & Analytics

### Key Metrics to Track

```sql
-- Total referrals by status
SELECT status, COUNT(*) 
FROM referrals 
GROUP BY status;

-- Top referrers
SELECT 
  u.email,
  rs.total_referrals,
  rs.successful_referrals,
  rs.total_earnings
FROM referral_stats rs
JOIN auth.users u ON u.id = rs.user_id
ORDER BY rs.total_earnings DESC
LIMIT 10;

-- Conversion rate
SELECT 
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status IN ('subscribed', 'rewarded') THEN 1 END) as converted,
  ROUND(
    COUNT(CASE WHEN status IN ('subscribed', 'rewarded') THEN 1 END)::numeric / 
    NULLIF(COUNT(*)::numeric, 0) * 100, 
    2
  ) as conversion_rate_percent
FROM referrals;

-- Pending payments summary
SELECT 
  COUNT(*) as pending_count,
  SUM(amount) as total_pending_amount
FROM referral_rewards
WHERE status = 'pending';
```

## Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly:** Review and process pending rewards
2. **Monthly:** Analyze referral conversion rates
3. **Quarterly:** Review and optimize reward amounts
4. **As needed:** Handle disputed or cancelled rewards

### Backup Important Data

```sql
-- Backup referral data
COPY (SELECT * FROM referral_codes) TO '/backup/referral_codes.csv' CSV HEADER;
COPY (SELECT * FROM referrals) TO '/backup/referrals.csv' CSV HEADER;
COPY (SELECT * FROM referral_rewards) TO '/backup/referral_rewards.csv' CSV HEADER;
COPY (SELECT * FROM referral_stats) TO '/backup/referral_stats.csv' CSV HEADER;
```

## Next Steps

1. Apply the database migration
2. Test the complete flow in development
3. Generate referral codes for existing users
4. Add navigation links
5. Deploy to production
6. Monitor initial performance
7. Iterate based on user feedback

For detailed documentation, see `REFERRAL_SYSTEM.md`.
