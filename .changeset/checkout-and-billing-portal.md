---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-stripe": minor
"@thomasfosterau/effect-payments-paypal": minor
"@thomasfosterau/effect-payments-airwallex": minor
---

Hosted checkout and billing portal capabilities.

- **Core:** two new capabilities, each a new subpath. `CheckoutSession` (`CheckoutSessions` service, `CheckoutSession.create`) creates a hosted checkout page. Its `CreateParams` is a union keyed on `mode`: `PaymentParams` (`mode: "payment"`) or `SubscriptionParams` (`mode: "subscription"`, which alone accepts `subscriptionMetadata`, stored on the subscription the checkout creates). Both take an optional `customer`, a non-empty `lineItems` tuple of price ids (quantity defaults to 1; no amount is ever an input), `successUrl`, `cancelUrl` and optional `metadata`. `BillingPortal` (`BillingPortalSessions` service, `BillingPortal.create`) creates a hosted self-service billing page for a `customer` with a `returnUrl`. Both return an entity with `id` and a required `url` to redirect to.
- **Stripe:** `StripePayments.checkoutSessionsLayer` (`POST /v1/checkout/sessions`; `subscriptionMetadata` becomes `subscription_data[metadata]`) and `StripePayments.billingPortalSessionsLayer` (`POST /v1/billing_portal/sessions`), both included in `capabilities`, `layer` and `layerFromEnv`. A 2xx without a non-empty `url` fails with `PaymentProviderError`.
- **PayPal / Airwallex:** `checkoutSessionsLayer` and `billingPortalSessionsLayer` stubs that fail every call with `PaymentInvalidRequestError` ("… does not support …"). They are not part of `capabilities`, so a program that needs a hosted checkout still fails to type-check against these providers unless it opts in to the stubs.
