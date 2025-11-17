# Lencopay Payment Integration

This document explains how the Lencopay mobile money payment system is integrated into the ConnectPro application.

## Overview

The application now supports real mobile money payments through Lencopay for:
- **Subscription payments** (K100/month)
- **Contact unlock payments** (K30 one-time)

## Architecture

### Payment API (Backend)
Location: `d:\personal\paymentapi`

A standalone Node.js/Express API that handles:
- Payment initiation with Lencopay
- Payment verification and status tracking
- Webhook handling for payment notifications
- Database updates via Supabase

**Key Endpoints:**
- `POST /api/payments/subscription/initiate` - Start subscription payment
- `POST /api/payments/contact-unlock/initiate` - Start contact unlock payment
- `POST /api/payments/verify` - Verify payment status
- `GET /api/payments/:reference` - Get payment by reference
- `POST /api/webhooks/lencopay` - Handle Lencopay webhooks

### Frontend Integration
Location: `d:\personal\code\src`

**Key Files:**
- `src/services/lencopay.service.ts` - Service for communicating with payment API
- `src/components/PaymentModal.tsx` - Updated payment modal with Lencopay integration
- `src/pages/client/Subscription.tsx` - Subscription management page
- `src/pages/browse/ProviderDetail.tsx` - Provider detail with contact unlock

## How It Works

### Subscription Payment Flow

1. **User initiates payment**
   - User clicks "Upgrade to Premium" button
   - PaymentModal opens with payment method selection

2. **User enters mobile money details**
   - Selects operator (Airtel, MTN, or Zamtel)
   - Enters phone number
   - Operator is auto-detected from phone number

3. **Payment initiation**
   - Frontend calls `lencoPayService.initiateSubscriptionPayment()`
   - Service sends request to payment API
   - Payment API calls Lencopay API
   - Lencopay sends push notification to user's phone

4. **User approves payment**
   - User receives prompt on their mobile phone
   - User enters PIN to approve payment

5. **Payment verification**
   - Frontend polls payment status every 10 seconds
   - Payment API verifies with Lencopay
   - When completed, subscription is activated in Supabase

6. **Success**
   - User sees success message
   - Subscription is active immediately
   - User gains unlimited profile views

### Contact Unlock Payment Flow

Similar to subscription, but:
- Amount is K30 (one-time)
- Creates `contact_unlock` record instead of subscription
- Unlocks specific provider's contact information

## Mobile Money Operators

### Supported Operators

| Operator | Prefixes | Example |
|----------|----------|---------|
| Airtel Money | 097, 077 | 0977123456 |
| MTN Mobile Money | 096, 076 | 0966123456 |
| Zamtel Kwacha | 095, 075 | 0955123456 |

### Auto-Detection

The system automatically detects the operator based on the phone number prefix:
```typescript
detectOperator('0977123456') // Returns 'airtel'
detectOperator('0966123456') // Returns 'mtn'
detectOperator('0955123456') // Returns 'zamtel'
```

## Setup Instructions

### 1. Start the Payment API

```bash
cd d:\personal\paymentapi

# Install dependencies (first time only)
npm install

# Create .env file from .env.example
cp .env.example .env

# Edit .env with your credentials (already configured)

# Start the API
npm run dev
```

The API will run on `http://localhost:3001`

### 2. Verify Frontend Configuration

The frontend is already configured to connect to the payment API at `http://localhost:3001`.

If you need to change this, edit `src/services/lencopay.service.ts`:
```typescript
const PAYMENT_API_URL = 'http://localhost:3001/api/payments';
```

### 3. Test the Integration

#### Test Subscription Payment

1. Navigate to `/client/subscription`
2. Click "Upgrade to Premium"
3. Select "Mobile Money"
4. Enter a test phone number: `0977123456`
5. Select operator (Airtel)
6. Click "Pay K100"
7. Approve payment on your phone (in sandbox mode, use test numbers)

#### Test Contact Unlock

1. Navigate to any provider detail page
2. Click "Unlock Contact - K30"
3. Follow same payment flow as subscription

## Testing

### Sandbox Mode

The payment API is configured to use Lencopay sandbox by default when `NODE_ENV=development`.

**Test Credentials:**
- Phone numbers: Use any valid Zambian format (0977123456)
- In sandbox, payments may be auto-approved or require test PIN

### Production Mode

To switch to production:

1. Update `.env` in payment API:
   ```env
   NODE_ENV=production
   LENCO_PUBLIC_KEY=your-production-public-key
   LENCO_SECRET_KEY=your-production-secret-key
   ```

2. Restart the payment API

## Database Schema

### Payments Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10, 2),
  payment_type VARCHAR(50), -- 'subscription' or 'contact_unlock'
  payment_method VARCHAR(50), -- 'mobile_money' or 'card'
  status VARCHAR(50), -- 'pending', 'completed', 'failed'
  provider_id UUID REFERENCES provider_profiles(id),
  transaction_reference VARCHAR(255),
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id),
  active BOOLEAN,
  plan VARCHAR(50),
  amount DECIMAL(10, 2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Contact Unlocks Table

```sql
CREATE TABLE contact_unlocks (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id),
  provider_id UUID REFERENCES provider_profiles(id),
  amount DECIMAL(10, 2),
  unlocked_at TIMESTAMPTZ,
  UNIQUE(client_id, provider_id)
);
```

## Error Handling

### Common Errors

**"Failed to initiate payment"**
- Check that payment API is running
- Verify Lencopay credentials in `.env`
- Check network connectivity

**"Payment verification timed out"**
- User may not have approved payment on phone
- Check payment status in Supabase `payments` table
- Verify webhook URL is configured in Lencopay dashboard

**"Invalid phone number"**
- Phone must be 10 digits starting with 09 or 07
- Format: 0977123456 or 0966123456

**"Contact already unlocked"**
- User has already paid to unlock this contact
- Check `contact_unlocks` table in Supabase

## Monitoring

### Payment API Logs

Logs are stored in `d:\personal\paymentapi\logs/`:
- `combined.log` - All logs
- `error.log` - Error logs only

View real-time logs:
```bash
cd d:\personal\paymentapi
tail -f logs/combined.log
```

### Database Monitoring

Check payment status in Supabase:

```sql
-- Recent payments
SELECT * FROM payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Pending payments
SELECT * FROM payments 
WHERE status = 'pending' 
AND created_at > NOW() - INTERVAL '1 hour';

-- Failed payments
SELECT * FROM payments 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

## Security

### API Security

- Rate limiting: 100 requests per 15 minutes per IP
- CORS: Configured for your domain
- Helmet: Security headers enabled
- Input validation: All inputs validated with express-validator

### Payment Security

- Lencopay API keys stored in environment variables
- Service role key used for Supabase admin operations
- Webhook signature verification (optional)
- HTTPS required in production

## Troubleshooting

### Payment API Not Starting

```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill process if needed
taskkill /PID <PID> /F

# Restart API
npm run dev
```

### Frontend Can't Connect to API

1. Verify API is running: `http://localhost:3001/health`
2. Check CORS settings in `src/app.ts`
3. Check browser console for errors

### Payment Stuck in Pending

1. Check if user approved payment on phone
2. Verify webhook is configured in Lencopay dashboard
3. Manually verify payment:
   ```bash
   curl -X POST http://localhost:3001/api/payments/verify \
     -H "Content-Type: application/json" \
     -d '{"reference": "SUB-1234567890-ABC123"}'
   ```

## Production Deployment

### Payment API Deployment

See `d:\personal\paymentapi\DEPLOYMENT.md` for detailed deployment instructions.

**Quick steps:**
1. Deploy to VPS, Heroku, or Railway
2. Set production environment variables
3. Configure webhook URL in Lencopay dashboard
4. Update frontend API URL if needed

### Frontend Deployment

Update `PAYMENT_API_URL` in `src/services/lencopay.service.ts` to your production API URL:
```typescript
const PAYMENT_API_URL = 'https://api.yourdomain.com/api/payments';
```

## Support

### Lencopay Support
- Email: [email protected]
- Documentation: https://lenco-api.readme.io/v2.0/reference

### Application Support
- Check logs in `d:\personal\paymentapi\logs/`
- Review Supabase database for payment records
- Test with sandbox credentials first

## Next Steps

1. **Test thoroughly in sandbox mode**
   - Test all payment flows
   - Verify database updates
   - Check error handling

2. **Configure webhooks**
   - Set webhook URL in Lencopay dashboard
   - Test webhook notifications

3. **Deploy to production**
   - Deploy payment API
   - Update production credentials
   - Test with real payments

4. **Monitor and optimize**
   - Monitor payment success rates
   - Track failed payments
   - Optimize user experience
