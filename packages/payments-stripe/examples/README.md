# Examples

These examples demonstrate `@thomasfosterau/effect-payments` (the vendor-neutral core) running on the `@thomasfosterau/effect-payments-stripe` provider.

## Running Examples

1. Install dependencies and build the packages from the repository root (the examples import the packages by name, which resolves to their built `dist/`):

   ```bash
   pnpm install
   vp run -r build
   ```

2. Set your Stripe API key:

   ```bash
   export STRIPE_API_KEY=sk_test_your_key_here
   ```

3. Run an example with Node (22.18 or later strips the TypeScript types natively):

   ```bash
   node packages/payments-stripe/examples/basic.ts
   ```

## Available Examples

### basic.ts

Vendor-neutral usage: the program imports only from `@thomasfosterau/effect-payments` and selects Stripe at the edge with `StripePayments.layer`. Covers creating a customer, creating a payment intent, and handling neutral errors.

### subscription.ts

Vendor-neutral subscription workflow: create a customer, a product, a recurring price, and a subscription — all through the neutral core.

### webhooks.ts

Stripe-specific: the SDK-based `Webhook.constructEvent` verifier and event handling (needs the optional `stripe` peer). The default, Workers-safe `Webhook.verify` is shown in the package README; rewriting this example onto it is #96.

## Note

These examples use Stripe test mode. Use test keys (starting with `sk_test_`), not live keys.
