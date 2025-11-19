# Admin Panel Documentation

## Overview

A comprehensive admin panel has been developed for managing all aspects of the platform. The admin panel provides a centralized interface for monitoring users, providers, subscriptions, payments, withdrawals, and referrals.

## Features

### 1. **Dashboard** (`/admin`)
- Overview statistics of the entire platform
- Key metrics including:
  - Total users, providers, and clients
  - Active subscriptions count
  - Total revenue
  - Pending withdrawals
  - Total referrals
  - Pending payments
- Real-time data visualization with color-coded cards

### 2. **Users Management** (`/admin/users`)
- View all registered users
- Search users by email or name
- Filter by user role (admin, provider, client)
- View detailed user information including:
  - User ID
  - Email
  - Role
  - Registration date
  - Last sign-in time
- User details dialog with complete metadata

### 3. **Providers Management** (`/admin/providers`)
- Comprehensive provider listing
- Search by name, location, or email
- View provider statistics:
  - Total profile views
  - Number of services offered
  - Age and location
  - Contact information
- Detailed provider view including:
  - Basic information
  - Bio
  - Complete services list with pricing
  - Profile analytics

### 4. **Subscriptions Management** (`/admin/subscriptions`)
- Track all user subscriptions
- Filter by status (all, active, expired)
- Search by user email
- Statistics dashboard showing:
  - Total subscriptions
  - Active subscriptions
  - Expired subscriptions
  - Monthly revenue
- View subscription details:
  - Plan type
  - Amount
  - Start and end dates
  - Current status

### 5. **Payments Management** (`/admin/payments`)
- Monitor all payment transactions
- Filter by status (all, pending, completed, failed)
- Search by email or transaction reference
- Payment statistics:
  - Total payments
  - Completed, pending, and failed counts
  - Total revenue
- View payment details:
  - Payment type (subscription, contact_unlock)
  - Payment method
  - Transaction reference
  - Timestamps

### 6. **Withdrawals Management** (`/admin/withdrawals`)
- Process withdrawal requests
- Filter by status (pending, processing, completed, rejected)
- Search by user email or phone number
- Withdrawal statistics:
  - Total requests
  - Status breakdown
  - Total amount paid out
- Actions:
  - **Process Withdrawal**: Complete withdrawal with transaction reference
  - **Reject Withdrawal**: Reject with reason
- Track withdrawal lifecycle from request to completion

### 7. **Referrals Management** (`/admin/referrals`)
- Manage referral rewards (existing page)
- View referral statistics
- Process reward payments
- Track referral performance

## Access Control

### Admin Authentication
- Only users with `role: 'admin'` in their `user_metadata` can access the admin panel
- Non-admin users are redirected with an "Access Denied" message
- Admin role is checked on both the layout and individual page levels

### Setting Admin Role
To grant admin access to a user, update their metadata in Supabase:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

Or use the Supabase Dashboard:
1. Go to Authentication > Users
2. Select the user
3. Edit User Metadata
4. Add: `{ "role": "admin" }`

## Navigation

The admin panel features a responsive sidebar with:
- **Desktop**: Persistent sidebar with navigation links
- **Mobile**: Collapsible sidebar with hamburger menu
- Quick access to all admin sections
- User profile display with sign-out option

## Routes

All admin routes are nested under `/admin`:

```
/admin                    → Dashboard
/admin/users              → Users Management
/admin/providers          → Providers Management
/admin/subscriptions      → Subscriptions Management
/admin/payments           → Payments Management
/admin/withdrawals        → Withdrawals Management
/admin/referrals          → Referrals Management
```

## Database Functions Used

The admin panel leverages several database functions:

### Withdrawal Management
- `process_withdrawal(p_request_id, p_transaction_reference, p_admin_notes)` - Complete a withdrawal
- `reject_withdrawal(p_request_id, p_rejection_reason)` - Reject a withdrawal
- `mark_withdrawal_processing(p_request_id)` - Mark as processing

### Subscription Queries
- Direct queries to `subscriptions` table
- Checks for active status and end_date

### Payment Tracking
- Queries to `payments` table
- Aggregations for revenue calculations

### User Management
- Uses Supabase Admin API: `supabase.auth.admin.listUsers()`
- Requires admin privileges

## Components Structure

```
src/pages/admin/
├── AdminLayout.tsx              # Main layout with sidebar
├── Dashboard.tsx                # Overview dashboard
├── UsersManagement.tsx          # User management
├── ProvidersManagement.tsx      # Provider management
├── SubscriptionsManagement.tsx  # Subscription management
├── PaymentsManagement.tsx       # Payment management
├── WithdrawalsManagement.tsx    # Withdrawal management
└── ReferralRewardsAdmin.tsx     # Referral management (existing)
```

## UI Components Used

The admin panel uses shadcn/ui components:
- `Card` - For content containers
- `Table` - For data display
- `Dialog` - For modals and details
- `Button` - For actions
- `Input` - For search and forms
- `Badge` - For status indicators
- `Textarea` - For multi-line input
- `Select` - For dropdowns

## Features by Page

### Dashboard
- **Real-time Stats**: Automatically fetches latest platform statistics
- **Color-coded Cards**: Different colors for different metrics
- **Loading States**: Spinner while data loads

### Users Management
- **Search**: Real-time search by email or name
- **User Details**: Click to view complete user information
- **Role Badges**: Visual indicators for user roles

### Providers Management
- **Service Tracking**: View all services offered by each provider
- **Analytics**: Profile views and engagement metrics
- **Detailed View**: Complete provider profile with services

### Subscriptions Management
- **Status Filters**: Quick filter by active/expired
- **Revenue Tracking**: Calculate monthly recurring revenue
- **Date Tracking**: Monitor subscription lifecycle

### Payments Management
- **Multi-status Tracking**: Pending, completed, failed
- **Payment Types**: Distinguish between subscriptions and unlocks
- **Revenue Analytics**: Total revenue calculations

### Withdrawals Management
- **Action Buttons**: Process or reject directly from table
- **Transaction Tracking**: Record transaction references
- **Admin Notes**: Add notes for record keeping
- **Rejection Reasons**: Document why withdrawals are rejected

## Best Practices

### Security
1. Always verify admin role before displaying sensitive data
2. Use RLS policies in Supabase for additional security
3. Never expose sensitive user data in URLs

### Performance
1. Implement pagination for large datasets (future enhancement)
2. Use indexes on frequently queried fields
3. Cache statistics where appropriate

### User Experience
1. Provide loading states for all async operations
2. Show clear error messages
3. Confirm destructive actions
4. Use toast notifications for feedback

## Future Enhancements

Potential improvements:
1. **Pagination**: Add pagination for large datasets
2. **Export**: CSV/Excel export functionality
3. **Charts**: Add visual charts and graphs
4. **Bulk Actions**: Select and process multiple items
5. **Audit Logs**: Track admin actions
6. **Email Notifications**: Notify users of admin actions
7. **Advanced Filters**: More filtering options
8. **Real-time Updates**: WebSocket for live data
9. **Client Management**: Dedicated client management page
10. **Analytics Dashboard**: Advanced analytics and reporting

## Troubleshooting

### "Access Denied" Error
- Verify user has `role: 'admin'` in user_metadata
- Check Supabase authentication is working
- Ensure user is logged in

### Data Not Loading
- Check Supabase connection
- Verify RLS policies allow admin access
- Check browser console for errors
- Ensure admin API access is enabled

### Functions Not Working
- Verify database functions exist in Supabase
- Check function permissions
- Review function parameters

## Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase logs
3. Verify database schema matches migrations
4. Check RLS policies

## Conclusion

The admin panel provides a powerful, user-friendly interface for managing all aspects of the platform. It's built with modern React practices, uses TypeScript for type safety, and integrates seamlessly with Supabase for real-time data management.
