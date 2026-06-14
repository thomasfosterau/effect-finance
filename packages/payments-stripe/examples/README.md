# Examples

These examples demonstrate `@thomasfosterau/effect-payments` (the vendor-neutral
core) running on the `@thomasfosterau/effect-payments-stripe` provider.

## Running Examples

1. Install dependencies from the repository root:
   ```bash
   bun install
   ```

2. Set your Stripe API key:
   ```bash
   export STRIPE_API_KEY=sk_test_your_key_here
   ```

3. Run an example with Bun:
   ```bash
   bun packages/payments-stripe/examples/basic.ts
   ```

## Available Examples

### basic.ts

Vendor-neutral usage: the program imports only from
`@thomasfosterau/effect-payments` and selects Stripe at the edge with
`StripePayments.layer`. Covers creating a customer, creating a payment intent,
and handling neutral errors.

### subscription.ts

Vendor-neutral subscription workflow: create a customer, a product, a recurring
price, and a subscription — all through the neutral core.

### webhooks.ts

Stripe-specific: webhook signature verification and event handling, using the
provider's `Webhook` module. Webhooks are inherently provider-shaped, so this
example uses the Stripe escape hatch directly.

## Note

These examples use Stripe test mode. Use test keys (starting with `sk_test_`),
not live keys.
