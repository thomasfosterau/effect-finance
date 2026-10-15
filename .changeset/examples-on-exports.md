---
"@thomasfosterau/effect-payments": patch
"@thomasfosterau/effect-payments-stripe": patch
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

The module-level doc examples now show on hover in a consumer's editor (#143). The bundled declarations dropped every file-level doc comment, so each example moved onto the module's primary export, and the module doc points at it: `Customer.create`, `CheckoutSession.create`, `BillingPortal.create`, `Stub.unavailable`, the `IdempotencyKey` schema and, for the core entry point, `Subscription.create`; `StripePayments.layer`, `PayPalPayments.layer` and `AirwallexPayments.layer` for the provider entry points; and `Webhook.verify` for the Stripe `Webhook` module. No behaviour changes.
