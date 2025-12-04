# Withdrawal System - Quick Start Guide

## 🚀 For Users: How to Withdraw Your Earnings

### Step 1: Check Your Balance
1. Navigate to **Referrals** page (`/referrals`)
2. Look at the stats cards at the top
3. Find **"Available to Withdraw"** card
4. See your points and K amount

### Step 2: Request Withdrawal
1. Click the **"Withdraw to Mobile Money"** button
2. A modal will open showing:
   - Your total balance
   - Already withdrawn amount
   - Pending requests
   - Available balance

### Step 3: Fill in Details
1. **Enter Points:** Type the number of points to withdraw (minimum 10,000)
   - The K amount will calculate automatically
   - Example: 20,000 points = K20
   
2. **Select Payment Method:**
   - Airtel Money
   - MTN Money
   - Zamtel Money

3. **Enter Phone Number:**
   - Your mobile money number
   - Example: 0977123456

### Step 4: Submit Request
1. Click **"Request Withdrawal"**
2. Wait for success message
3. Your request is now pending

### Step 5: Track Your Request
1. Go to **"Withdrawals"** tab on the Referrals page
2. See all your withdrawal requests
3. Check status:
   - 🟡 **Pending** - Waiting for admin to process
   - 🔵 **Processing** - Admin is working on it
   - 🟢 **Completed** - Money sent! Check your phone
   - 🔴 **Rejected** - See reason and try again

### Step 6: Receive Money
- Admin will process within 24-48 hours
- You'll receive money on your mobile money account
- Transaction reference will be shown in the Withdrawals tab

---

## 👨‍💼 For Admins: How to Process Withdrawals

### Step 1: Access Withdrawals
1. Go to **Admin Panel** (`/admin`)
2. Click **"Withdrawals"** in the sidebar
3. See all withdrawal requests

### Step 2: Review Pending Requests
1. Look at the **"Pending"** count in stats
2. Click **"Pending"** filter button to see only pending requests
3. Review each request:
   - User name and email
   - Points and amount (K)
   - Payment method
   - Phone number
   - Request date

### Step 3: Process a Withdrawal

#### Option A: Approve and Complete
1. Click **"Process"** button on the request
2. Send money via mobile money to the phone number shown
3. Get the transaction reference from mobile money
4. Enter the **Transaction Reference** in the dialog
5. Add **Admin Notes** (optional)
6. Click **"Complete Withdrawal"**
7. Status changes to **Completed** ✅

#### Option B: Reject
1. Click **"Reject"** button on the request
2. Enter a clear **Rejection Reason**
   - Example: "Invalid phone number"
   - Example: "Duplicate request"
3. Click **"Reject Withdrawal"**
4. Status changes to **Rejected** ❌
5. User can see the reason

### Step 4: Use Filters & Search
- **Filter by Status:** All, Pending, Processing, Completed, Rejected
- **Search:** Type user name, email, or phone number
- **Sort:** Newest requests appear first

### Step 5: Monitor Statistics
Keep track of:
- Total requests
- Pending (needs action)
- Processing (in progress)
- Completed (paid)
- Rejected
- Total amount paid

---

## 💡 Tips & Best Practices

### For Users
✅ **DO:**
- Ensure your phone number is correct
- Wait for minimum K10 before withdrawing
- Check withdrawal history regularly
- Keep track of your referrals

❌ **DON'T:**
- Submit duplicate requests
- Use incorrect phone numbers
- Expect instant processing (takes 24-48 hours)
- Withdraw less than K10

### For Admins
✅ **DO:**
- Verify phone numbers before sending money
- Always record transaction references
- Process requests in order (first-come, first-served)
- Provide clear rejection reasons
- Check user details carefully

❌ **DON'T:**
- Process without verifying details
- Skip recording transaction references
- Reject without clear reasons
- Process the same request twice

---

## 🔢 Quick Reference

### Conversion Rates
```
20,000 points = K20
10,000 points = K10 (minimum)
5,000 points  = K5
1,000 points  = K1
```

### Status Meanings
- **Pending:** Just submitted, waiting for admin
- **Processing:** Admin is working on it
- **Completed:** Money sent successfully
- **Rejected:** Request denied with reason

### Processing Time
- **Normal:** 24-48 hours
- **Weekends:** May take longer
- **Holidays:** May take longer

### Payment Methods
- **Airtel Money:** For Airtel users
- **MTN Money:** For MTN users
- **Zamtel Money:** For Zamtel users

---

## 🆘 Troubleshooting

### User Issues

**"Withdraw button is disabled"**
- You need at least 10,000 points (K10)
- Keep referring friends to earn more

**"Insufficient balance error"**
- You're trying to withdraw more than available
- Check your available balance
- Subtract any pending requests

**"Request is pending for long time"**
- Normal processing is 24-48 hours
- Check on weekends/holidays
- Contact admin if > 48 hours

**"Request was rejected"**
- Read the rejection reason
- Fix the issue (e.g., correct phone number)
- Submit a new request

### Admin Issues

**"Can't see withdrawal requests"**
- Ensure you're logged in as admin
- Check your admin role
- Refresh the page

**"Can't process withdrawal"**
- Ensure request is in "pending" status
- Transaction reference is required
- Check your admin permissions

**"User details not showing"**
- User may not have completed profile
- Check both provider and client profiles
- Contact user for details

---

## 📱 Mobile Money Instructions

### Airtel Money
1. Dial `*778#`
2. Select "Send Money"
3. Enter recipient number
4. Enter amount
5. Confirm
6. Save transaction reference

### MTN Money
1. Dial `*303#`
2. Select "Send Money"
3. Enter recipient number
4. Enter amount
5. Confirm
6. Save transaction reference

### Zamtel Money
1. Dial `*555#`
2. Select "Send Money"
3. Enter recipient number
4. Enter amount
5. Confirm
6. Save transaction reference

---

## 🎯 Success Metrics

### For Users
- ✅ Successful withdrawal completed
- ✅ Money received in mobile money
- ✅ Transaction reference visible
- ✅ Balance updated correctly

### For Admins
- ✅ All pending requests processed
- ✅ Transaction references recorded
- ✅ No rejected requests without reasons
- ✅ Statistics accurate

---

## 📞 Need Help?

### Users
- Check the Withdrawals tab for status updates
- Read rejection reasons carefully
- Ensure minimum K10 balance
- Verify phone number is correct

### Admins
- Review the full documentation: `WITHDRAWAL_SYSTEM.md`
- Check implementation details: `WITHDRAWAL_IMPLEMENTATION_SUMMARY.md`
- Contact technical support if issues persist

---

## ✅ Quick Checklist

### Before Requesting Withdrawal (Users)
- [ ] I have at least 10,000 points (K10)
- [ ] My phone number is correct
- [ ] I selected the right payment method
- [ ] I don't have pending requests for same amount

### Before Processing Withdrawal (Admins)
- [ ] I verified the phone number
- [ ] I sent the money via mobile money
- [ ] I have the transaction reference
- [ ] I'm processing the correct request

---

**That's it! The withdrawal system is simple and straightforward. Users earn, request, and receive. Admins review, process, and confirm. Everyone wins! 🎉**
