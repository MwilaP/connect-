# Payment System Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Payment API

Open a terminal and run:

```bash
cd d:\personal\paymentapi
npm install
npm run dev
```

You should see:
```
🚀 Lencopay Payment API started successfully
📡 Server running on port 3001
🌍 Environment: development
💳 Currency: ZMW
```

### Step 2: Start Your Main Application

Open another terminal and run:

```bash
cd d:\personal\code
npm run dev
```

### Step 3: Test a Payment

1. **Login to your application**
   - Navigate to `http://localhost:5173` (or your dev port)
   - Login with your account

2. **Test Subscription Payment**
   - Go to "Subscription" page
   - Click "Upgrade to Premium - K100/month"
   - Select "Mobile Money"
   - Enter phone: `0977123456`
   - Select operator: Airtel
   - Click "Pay K100"
   - Wait for payment prompt (in sandbox mode)

3. **Test Contact Unlock**
   - Browse providers
   - Click on any provider
   - Click "Unlock Contact - K30"
   - Follow same payment flow

## ✅ Verify Everything Works

### Check Payment API Health

Open browser: `http://localhost:3001/health`

Should return:
```json
{
  "success": true,
  "message": "Lencopay Payment API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Check Database

Open Supabase dashboard and verify:
- `payments` table has new records
- `subscriptions` table updated (for subscription payments)
- `contact_unlocks` table updated (for contact unlock payments)

## 📱 Mobile Money Test Numbers

### Sandbox Mode (Development)

Use any valid Zambian phone number format:
- Airtel: `0977123456` or `0771234567`
- MTN: `0966123456` or `0761234567`
- Zamtel: `0955123456` or `0751234567`

### Production Mode

Use real phone numbers. Users will receive actual payment prompts.

## 🔧 Troubleshooting

### Payment API Won't Start

**Error: Port 3001 already in use**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Then restart
npm run dev
```

**Error: Missing environment variables**
- Check `.env` file exists in `d:\personal\paymentapi`
- Copy from `.env.example` if missing
- Verify all required variables are set

### Payment Fails

**"Failed to initiate payment"**
- Ensure payment API is running
- Check console for errors
- Verify Lencopay credentials in `.env`

**"Invalid phone number"**
- Must be 10 digits
- Must start with 09 or 07
- Example: 0977123456

**"Payment verification timed out"**
- In sandbox mode, payment may need manual approval
- Check payment status in Supabase
- Try again with a different phone number

### Frontend Can't Connect

**"Network Error"**
- Verify payment API is running on port 3001
- Check `http://localhost:3001/health`
- Check browser console for CORS errors

## 📊 Monitor Payments

### View Logs

```bash
cd d:\personal\paymentapi
tail -f logs/combined.log
```

### Check Database

```sql
-- Recent payments
SELECT 
  id,
  user_id,
  amount,
  payment_type,
  status,
  transaction_reference,
  created_at
FROM payments 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🎯 What's Next?

1. **Test all payment flows**
   - Subscription payments
   - Contact unlock payments
   - Payment failures
   - Payment cancellations

2. **Configure webhooks** (Optional)
   - Login to Lencopay dashboard
   - Add webhook URL: `http://localhost:3001/api/webhooks/lencopay`
   - Select event: `collection.successful`

3. **Customize amounts** (Optional)
   - Edit `.env` in payment API:
     ```env
     SUBSCRIPTION_AMOUNT=100.00
     CONTACT_UNLOCK_AMOUNT=30.00
     ```

4. **Deploy to production**
   - See `DEPLOYMENT.md` in payment API folder
   - Update production credentials
   - Test with real payments

## 📚 More Information

- **Full Integration Guide**: `LENCOPAY_INTEGRATION.md`
- **Payment API Docs**: `d:\personal\paymentapi\README.md`
- **API Testing Guide**: `d:\personal\paymentapi\API_TESTING.md`
- **Deployment Guide**: `d:\personal\paymentapi\DEPLOYMENT.md`

## 🆘 Need Help?

### Check These First

1. Is payment API running? → `http://localhost:3001/health`
2. Are credentials correct? → Check `.env` file
3. Is Supabase connected? → Check Supabase dashboard
4. Any errors in logs? → Check `logs/combined.log`

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 3001 in use | Kill process and restart |
| Invalid credentials | Check `.env` file |
| Payment timeout | User didn't approve on phone |
| Database error | Check Supabase connection |

### Still Stuck?

1. Check payment API logs: `d:\personal\paymentapi\logs\`
2. Check browser console for errors
3. Review Lencopay API documentation
4. Contact Lencopay support: [email protected]

## ✨ Success!

If you can complete a test payment and see it in the database, you're all set! 🎉

The payment system is now fully integrated and ready to use.
