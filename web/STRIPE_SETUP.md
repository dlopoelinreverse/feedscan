# Stripe Setup

## 1. Create a Stripe Account

Go to [stripe.com](https://stripe.com) and create an account. Use **Test mode** for development.

## 2. Create Products

In the Stripe Dashboard, go to **Products** and create two products:

1. **FeedScan Pro** - Recurring price: **$24 CAD / month**
   - Copy the `price_id` (e.g., `price_1Abc...`)
2. **FeedScan Business** - Recurring price: **$49 CAD / month**
   - Copy the `price_id`

## 3. Get API Keys

Go to **Developers > API Keys**:

- Copy the **Publishable key** (`pk_test_...`)
- Copy the **Secret key** (`sk_test_...`)

## 4. Set Up Webhook

Go to **Developers > Webhooks** and add an endpoint:

- **URL**: `https://app.feedscan.leopoldev/api/stripe/webhook`
- **Events** to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Copy the **Webhook signing secret** (`whsec_...`)

For local development, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

## 5. Configure Environment Variables

Add to your `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
```

## 6. Test Cards

Use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC will work.

## 7. Customer Portal

To enable the Customer Portal (manage subscription, cancel, update payment):

1. Go to **Settings > Billing > Customer portal**
2. Enable the features you want (cancellation, plan changes, payment method updates)
3. Save the configuration
