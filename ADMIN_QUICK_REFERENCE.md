# Admin Panel - Quick Reference Guide

## 🚀 Quick Start

### Access Admin Panel
```
URL: /admin
Required: Admin role in user_metadata
```

### Grant Admin Access
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

## 📊 Dashboard Overview

### Key Metrics at a Glance
- **Total Users** - All registered users
- **Providers** - Service provider count
- **Clients** - Client user count
- **Active Subscriptions** - Currently active subscriptions
- **Total Revenue** - All completed payments
- **Pending Withdrawals** - Awaiting processing
- **Total Referrals** - All referral records
- **Pending Payments** - Awaiting completion

## 👥 Users Management

### Search Users
```
Search by: Email, Name
View: User ID, Email, Role, Registration Date, Last Sign In
```

### View User Details
1. Click "Details" button
2. View complete user information
3. Check user metadata and timestamps

## 🏪 Providers Management

### Key Information
- Provider name and email
- Location and age
- Services offered
- Profile views
- Contact information

### View Provider Details
1. Click "View Details"
2. See basic info, bio, and services
3. Check service pricing and descriptions

## 💳 Subscriptions Management

### Filter Options
- **All** - All subscriptions
- **Active** - Currently active
- **Expired** - Past end date

### Key Data
- User email
- Plan type (monthly, etc.)
- Amount paid
- Start and end dates
- Current status

## 💰 Payments Management

### Filter by Status
- **All** - All payments
- **Completed** - Successful payments
- **Pending** - Awaiting completion
- **Failed** - Failed transactions

### Payment Types
- **Subscription** - Monthly subscription payments
- **Contact Unlock** - One-time contact unlock fees

### Search
```
Search by: Email, Transaction Reference
```

## 💸 Withdrawals Management

### Process Withdrawal
1. Click "Process" on pending request
2. Enter transaction reference
3. Add admin notes (optional)
4. Click "Complete Withdrawal"

### Reject Withdrawal
1. Click "Reject" on pending request
2. Enter rejection reason (required)
3. Click "Reject Withdrawal"

### Status Flow
```
Pending → Processing → Completed
        ↓
      Rejected
```

## 🎁 Referrals Management

### View Referral Rewards
- Referrer and referred user emails
- Reward amount and points
- Status (pending, approved, paid)
- Dates (created, approved, paid)

### Process Rewards
1. Review pending rewards
2. Approve or reject
3. Process payments
4. Track completion

## 🔍 Search & Filter Tips

### Effective Searching
- Use partial matches (e.g., "john" finds "john@example.com")
- Search is case-insensitive
- Real-time filtering as you type

### Filter Combinations
- Apply status filter first
- Then use search to narrow results
- Filters persist until changed

## ⚡ Common Tasks

### Task: Find a User's Subscription
1. Go to Subscriptions Management
2. Search by user email
3. View subscription details

### Task: Process Pending Withdrawal
1. Go to Withdrawals Management
2. Filter by "Pending"
3. Click "Process" on the request
4. Enter transaction reference
5. Complete the withdrawal

### Task: Check Provider Performance
1. Go to Providers Management
2. Search for provider
3. Click "View Details"
4. Review views and services

### Task: Monitor Revenue
1. Go to Dashboard
2. Check "Total Revenue" card
3. Go to Payments Management for details
4. Filter by "Completed" to see successful payments

### Task: Review Failed Payments
1. Go to Payments Management
2. Filter by "Failed"
3. Review transaction details
4. Contact users if needed

## 🔐 Security Best Practices

### Do's ✅
- ✅ Log out when finished
- ✅ Use strong passwords
- ✅ Verify user identity before actions
- ✅ Document important decisions
- ✅ Review audit logs regularly

### Don'ts ❌
- ❌ Share admin credentials
- ❌ Leave session unattended
- ❌ Process withdrawals without verification
- ❌ Delete data without backup
- ❌ Ignore suspicious activity

## 🐛 Troubleshooting

### "Access Denied" Error
```
Problem: Can't access admin panel
Solution: 
1. Verify admin role in database
2. Log out and log back in
3. Check user_metadata.role = 'admin'
```

### Data Not Loading
```
Problem: Tables show "No data found"
Solution:
1. Check browser console for errors
2. Verify Supabase connection
3. Check RLS policies
4. Refresh the page
```

### Withdrawal Function Error
```
Problem: Can't process withdrawals
Solution:
1. Verify database functions exist
2. Check function permissions
3. Review migration status
```

### User Email Shows "Unknown"
```
Problem: Email not displaying
Solution:
1. Check Supabase Admin API access
2. Verify user exists in auth.users
3. Check RLS policies
```

## 📱 Mobile Access

### Mobile Navigation
- Tap hamburger menu (☰) to open sidebar
- Tap outside sidebar to close
- Swipe tables horizontally to see all columns

### Mobile Best Practices
- Use landscape mode for tables
- Zoom in for small text
- Use search to reduce results

## 🎯 Keyboard Shortcuts

### Navigation
- `Ctrl/Cmd + K` - Focus search (if implemented)
- `Esc` - Close dialogs
- `Enter` - Submit forms

### Browser
- `Ctrl/Cmd + R` - Refresh page
- `Ctrl/Cmd + F` - Find in page
- `Ctrl/Cmd + +/-` - Zoom in/out

## 📈 Statistics Interpretation

### Dashboard Metrics

**Total Users**
- All registered accounts
- Includes providers, clients, and admins

**Active Subscriptions**
- Subscriptions with end_date > now
- Indicates recurring revenue

**Pending Withdrawals**
- Awaiting admin action
- Requires immediate attention

**Total Revenue**
- Sum of all completed payments
- Includes subscriptions and unlocks

## 🔄 Regular Maintenance Tasks

### Daily
- [ ] Check pending withdrawals
- [ ] Review failed payments
- [ ] Monitor dashboard metrics

### Weekly
- [ ] Review new user signups
- [ ] Check provider activity
- [ ] Analyze revenue trends
- [ ] Process referral rewards

### Monthly
- [ ] Audit admin actions
- [ ] Review subscription renewals
- [ ] Generate reports
- [ ] Clean up old data (if needed)

## 📞 Support Contacts

### Technical Issues
- Check browser console
- Review Supabase logs
- Contact development team

### User Issues
- Verify user account status
- Check payment history
- Review subscription status

## 🎓 Training Checklist

For new admin users:

- [ ] Understand admin role and responsibilities
- [ ] Learn navigation and layout
- [ ] Practice searching and filtering
- [ ] Process test withdrawal (in dev)
- [ ] Review all sections
- [ ] Understand security protocols
- [ ] Know who to contact for help

## 📚 Additional Resources

### Documentation
- `ADMIN_PANEL_GUIDE.md` - Detailed feature guide
- `ADMIN_SETUP.md` - Setup instructions
- `ADMIN_PANEL_ARCHITECTURE.md` - Technical architecture

### External Links
- Supabase Documentation
- React Router Documentation
- Tailwind CSS Documentation

## 💡 Pro Tips

1. **Use Filters First** - Apply status filters before searching to reduce results
2. **Bookmark Common Pages** - Save frequently used admin pages
3. **Keep Notes** - Document unusual cases or decisions
4. **Regular Checks** - Review pending items daily
5. **Verify Before Action** - Double-check before processing withdrawals
6. **Monitor Trends** - Watch for unusual patterns in data
7. **Stay Updated** - Keep track of platform changes
8. **Test in Dev** - Try new features in development first

## 🚨 Emergency Procedures

### Suspicious Activity
1. Document the activity
2. Check related user accounts
3. Review recent transactions
4. Contact security team
5. Consider temporary suspension

### System Issues
1. Check Supabase status
2. Review error logs
3. Contact technical support
4. Document the issue
5. Communicate with users if needed

### Data Concerns
1. Don't delete data immediately
2. Verify the issue
3. Create backup if needed
4. Consult with team
5. Document actions taken

---

**Remember**: With great power comes great responsibility. Always verify before taking action, and when in doubt, ask for help!
