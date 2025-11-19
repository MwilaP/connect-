# Test Amounts Updated ✅

## Changes Made

All subscription amounts have been reduced from **K100** to **K5** for testing purposes.

### Frontend App Changes

✅ **Updated Files:**
1. `src/pages/client/Subscription.tsx` - Subscription page
2. `src/pages/browse/ProviderDetail.tsx` - Provider detail page
3. `src/pages/browse/BrowseList.tsx` - Browse list page
4. `src/hooks/useSubscription.ts` - Subscription hook

**Changes:**
- Display text: "K100/month" → "K5/month"
- Payment amount: `amount={100}` → `amount={5}`
- Database records: `amount: 100` → `amount: 5`

### Payment API Changes

✅ **Update Required:**
Edit your `.env` file at `d:\personal\paymentapi\.env`:

```env
# Change from:
SUBSCRIPTION_AMOUNT=100.00

# To:
SUBSCRIPTION_AMOUNT=5.00
```

Then **restart the payment API**:
```bash
cd d:\personal\paymentapi
pnpm run dev
```

## Testing

Now you can test subscriptions with just **K5** instead of K100!

### Test Flow

1. **Start Payment API** (with updated .env)
   ```bash
   cd d:\personal\paymentapi
   pnpm run dev
   ```

2. **Start Frontend App**
   ```bash
   cd d:\personal\code
   npm run dev
   ```

3. **Test Subscription Payment**
   - Go to Subscription page
   - Click "Upgrade to Premium - K5/month"
   - Enter phone: `0977123456` (or your test number)
   - Select operator: Airtel
   - Click "Pay K5"
   - Approve on your phone

4. **Verify**
   - Check payment API logs
   - Check Supabase `payments` table (amount should be 5.00)
   - Check Supabase `subscriptions` table (amount should be 5.00)
   - User should have active subscription

## Contact Unlock Amount

Contact unlock is still **K30**. To change it:

**Payment API `.env`:**
```env
CONTACT_UNLOCK_AMOUNT=5.00  # Or any test amount
```

**Frontend files to update:**
- `src/components/PaymentModal.tsx` (if hardcoded)
- `src/hooks/useSubscription.ts` (unlockContact function)

## Reverting to Production Amounts

When ready for production, change back to:

**Payment API `.env`:**
```env
SUBSCRIPTION_AMOUNT=100.00
CONTACT_UNLOCK_AMOUNT=30.00
```

**Frontend files:**
- Change all `amount={5}` back to `amount={100}`
- Change all "K5" text back to "K100"
- Update `useSubscription.ts` amounts

## Summary

✅ Subscription: **K100 → K5**
⏳ Contact Unlock: **K30** (unchanged)

**Next Step:** Update payment API `.env` file and restart!
