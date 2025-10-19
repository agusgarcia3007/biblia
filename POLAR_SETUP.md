# Polar Paywall Setup Guide

This document explains the complete paywall implementation for the "Talk with a Saint" premium feature.

## Overview

The application implements a freemium model:
- **Free**: All features except talking with saints (default persona only)
- **Premium ($4.99/month)**: Ability to chat with San Agustín, Santa Teresa de Ávila, and San Francisco de Asís

## Setup Instructions

### 1. Environment Variables

Ensure the following variables are set in your `.env` file:

```bash
POLAR_ACCESS_TOKEN=your_polar_access_token
PRODUCT_ID=your_product_id
```

### 2. Database Migration

Run the updated schema to create the `subscriptions` table:

```bash
# In Supabase Dashboard, run the schema.sql or manually create the table:
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_polar_id ON subscriptions(polar_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');
```

### 3. Configure Polar Webhook

1. Go to your Polar dashboard: https://polar.sh/dashboard
2. Navigate to Settings → Webhooks
3. Add a new webhook with the following URL:
   ```
   https://yourdomain.com/api/webhooks/polar
   ```
4. Select the following events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.active`
   - `subscription.canceled`
   - `subscription.revoked`

### 4. Product Configuration

Ensure your Polar product is configured with:
- Price: $4.99/month
- Recurring: Monthly subscription
- The product ID matches the `PRODUCT_ID` environment variable

## How It Works

### User Flow

1. **User visits chat page**: Free access with default persona (San Agustín)
2. **User clicks "Advanced Options"**: Sees all available saint personas
3. **User selects premium saint**: Paywall dialog appears with crown icon
4. **Not authenticated**: User is redirected to login/signup, then back to subscribe
5. **Authenticated**: User can proceed directly to Polar checkout
6. **After payment**: Polar sends webhook to activate subscription
7. **Access granted**: User can now select and chat with premium saints

### Technical Flow

```
User Action → Check Authentication → Check Subscription
              ↓                      ↓
         Login/Signup            Has Access?
              ↓                      ↓
         Polar Checkout         YES → Allow
              ↓                      ↓
         Webhook Event          NO → Show Paywall
              ↓
         Update Database
              ↓
         Grant Access
```

### API Routes

#### `/api/subscription/check` (GET)
- **Purpose**: Check if user has active subscription
- **Returns**: `{ hasAccess: boolean, user: { id, email } }`
- **Authentication**: Required

#### `/api/subscription/checkout` (POST)
- **Purpose**: Create Polar checkout session
- **Returns**: `{ checkoutUrl: string, sessionId: string }`
- **Authentication**: Required
- **Behavior**: Links checkout to user via `external_customer_id`

#### `/api/webhooks/polar` (POST)
- **Purpose**: Handle Polar subscription events
- **Events Handled**:
  - `subscription.created` → Create subscription record
  - `subscription.active` → Activate subscription
  - `subscription.canceled` → Deactivate subscription
  - `subscription.revoked` → Deactivate subscription
- **Authentication**: None (webhook signature validation recommended)

## Testing the Flow

### Local Development

1. Use ngrok or a similar tool to expose your local server:
   ```bash
   ngrok http 3000
   ```

2. Update the webhook URL in Polar dashboard to your ngrok URL:
   ```
   https://your-ngrok-url.ngrok.io/api/webhooks/polar
   ```

3. Test the flow:
   - Start the dev server: `npm run dev`
   - Visit `/chat`
   - Try selecting a premium saint (Santa Teresa or San Francisco)
   - Verify paywall appears
   - Complete checkout flow
   - Check webhook is received
   - Verify subscription is activated in database

### Testing Checklist

- [ ] Free access works with default persona
- [ ] Premium saints show crown icon
- [ ] Clicking premium saint shows paywall
- [ ] Unauthenticated users are redirected to login
- [ ] Authenticated users can access checkout
- [ ] Checkout redirects to Polar
- [ ] Webhook is received after payment
- [ ] Subscription is stored in database
- [ ] User can access premium saints after payment
- [ ] Subscription status updates on cancel

## Troubleshooting

### Webhook not received
- Check webhook URL is correct and accessible
- Verify Polar webhook events are enabled
- Check server logs for errors
- Ensure route is not blocked by middleware

### Subscription check failing
- Verify `POLAR_ACCESS_TOKEN` is set correctly
- Check API token has `subscriptions:read` scope
- Ensure `external_customer_id` matches user ID

### Checkout not working
- Verify `PRODUCT_ID` is correct
- Check API token has `checkouts:write` scope
- Ensure user email is valid

## Security Considerations

1. **Webhook Validation**: Consider adding signature validation for Polar webhooks
2. **Rate Limiting**: Add rate limiting to API routes
3. **Authentication**: All subscription routes require authentication
4. **Database Security**: RLS policies ensure users only see their own subscriptions

## Future Enhancements

- [ ] Add webhook signature validation
- [ ] Implement subscription cancellation flow
- [ ] Add billing portal integration
- [ ] Show subscription status in user profile
- [ ] Add grace period for failed payments
- [ ] Implement usage analytics
