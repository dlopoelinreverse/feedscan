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
- **Events** to listen for (exactly these — the handler is a no-op for anything else):
  - `checkout.session.completed` → initial subscription creation after payment
  - `customer.subscription.created` → safety net if the session event is missed
  - `customer.subscription.updated` → plan changes, status transitions (incl. cancel-at-period-end)
  - `customer.subscription.deleted` → final cancellation → downgrade to FREE
  - `invoice.payment_failed` → renewal failure → immediate downgrade to FREE (no grace period)
- Copy the **Webhook signing secret** (`whsec_...`)

### Local testing

In one terminal, forward Stripe events to your dev server:

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Then trigger events from another terminal:

```bash
# Full happy path — checkout completes, plan goes to PRO/BUSINESS
stripe trigger checkout.session.completed

# Renewal failure — plan should drop back to FREE
stripe trigger invoice.payment_failed

# Cancellation from the Customer Portal — plan should drop back to FREE
stripe trigger customer.subscription.deleted
```

### Defensive sync

The settings page (`/dashboard/settings?stripe_session_id={CHECKOUT_SESSION_ID}`)
re-reads the Checkout Session from Stripe on the success redirect and
reconciles the user row if the webhook hasn't landed yet. This means the UI
reflects the new plan even when the webhook is delayed or temporarily down.

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
