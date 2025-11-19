# Admin Panel Setup Guide

## Quick Start

### 1. Grant Admin Access

To access the admin panel, a user must have the `admin` role in their user metadata.

#### Option A: Using Supabase SQL Editor

```sql
-- Replace 'admin@example.com' with the actual admin email
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

#### Option B: Using Supabase Dashboard

1. Navigate to **Authentication** → **Users**
2. Find and click on the user you want to make admin
3. Scroll to **User Metadata**
4. Click **Edit**
5. Add or update the JSON:
   ```json
   {
     "role": "admin"
   }
   ```
6. Click **Save**

### 2. Access the Admin Panel

Once admin access is granted:

1. Log in to the application with the admin account
2. Navigate to `/admin` in your browser
3. You should see the admin dashboard

**URL**: `http://localhost:5173/admin` (development) or `https://yourdomain.com/admin` (production)

## Admin Panel Routes

| Route | Description |
|-------|-------------|
| `/admin` | Main dashboard with statistics |
| `/admin/users` | Manage all users |
| `/admin/providers` | Manage service providers |
| `/admin/subscriptions` | Track subscriptions |
| `/admin/payments` | Monitor payments |
| `/admin/withdrawals` | Process withdrawal requests |
| `/admin/referrals` | Manage referral rewards |

## Required Database Setup

Ensure all migrations have been run:

```bash
# Check migrations in supabase/migrations/
# All should be applied to your database
```

### Key Tables Required

- `auth.users` - User authentication
- `provider_profiles` - Provider information
- `client_profiles` - Client information
- `subscriptions` - Subscription data
- `payments` - Payment transactions
- `withdrawal_requests` - Withdrawal requests
- `referrals` - Referral tracking
- `referral_rewards` - Referral rewards
- `provider_services` - Provider services

### Key Functions Required

- `process_withdrawal()`
- `reject_withdrawal()`
- `mark_withdrawal_processing()`

## Permissions & RLS Policies

The admin panel requires specific RLS policies to be in place:

### Admin Access Policies

Most tables should have policies like:

```sql
-- Example for withdrawal_requests
CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

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

### Supabase Admin API

The admin panel uses `supabase.auth.admin` methods which require:

1. **Service Role Key** (for server-side operations)
2. Or **Admin API Access** enabled in Supabase settings

For client-side admin operations, ensure your Supabase client is configured correctly:

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Testing Admin Access

### 1. Create Test Admin User

```sql
-- Create a test admin user
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  'admin@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"role": "admin"}'::jsonb
);
```

### 2. Test Login

1. Log in with the admin credentials
2. Navigate to `/admin`
3. Verify you can see the dashboard
4. Test each section:
   - Users
   - Providers
   - Subscriptions
   - Payments
   - Withdrawals
   - Referrals

### 3. Test Permissions

Try accessing admin routes with:
- **Admin user**: Should work ✓
- **Regular user**: Should see "Access Denied" ✓
- **Not logged in**: Should redirect to login ✓

## Common Issues & Solutions

### Issue: "Access Denied" for Admin User

**Solution:**
1. Verify user metadata:
   ```sql
   SELECT email, raw_user_meta_data 
   FROM auth.users 
   WHERE email = 'your-admin@email.com';
   ```
2. Ensure the role is exactly `"admin"` (case-sensitive)
3. Log out and log back in to refresh the session

### Issue: Data Not Loading

**Solution:**
1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Check RLS policies allow admin access
4. Ensure tables exist and have data

### Issue: "getUserById is not a function"

**Solution:**
This means the admin API is not available. You need to:
1. Use the service role key (server-side only)
2. Or implement a server-side API endpoint
3. Or use alternative queries without admin API

### Issue: Withdrawal Functions Not Found

**Solution:**
Run the withdrawal system migration:
```bash
# Ensure this migration is applied:
# supabase/migrations/20250113_create_withdrawal_system.sql
```

## Security Checklist

Before deploying to production:

- [ ] Admin role is properly set in user metadata
- [ ] RLS policies are in place for all tables
- [ ] Admin API access is secured (use service role key server-side)
- [ ] Admin routes are protected in the frontend
- [ ] Sensitive data is not exposed in URLs or logs
- [ ] Admin actions are logged (implement audit trail)
- [ ] HTTPS is enabled in production
- [ ] Environment variables are properly configured

## Development vs Production

### Development
- Use `VITE_SUPABASE_ANON_KEY` for client operations
- Admin panel accessible at `http://localhost:5173/admin`
- Use test admin accounts

### Production
- Ensure proper environment variables are set
- Use HTTPS only
- Implement rate limiting
- Add audit logging
- Monitor admin actions
- Use strong passwords for admin accounts
- Consider 2FA for admin users

## Next Steps

After setup:

1. **Create your first admin user**
2. **Test all admin features**
3. **Set up monitoring** for admin actions
4. **Configure notifications** for critical events
5. **Document admin procedures** for your team
6. **Train admin users** on the panel features

## Support

If you encounter issues:

1. Check the `ADMIN_PANEL_GUIDE.md` for detailed feature documentation
2. Review Supabase logs for errors
3. Check browser console for client-side errors
4. Verify all migrations are applied
5. Test RLS policies in Supabase SQL editor

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/auth-admin-listusers)
