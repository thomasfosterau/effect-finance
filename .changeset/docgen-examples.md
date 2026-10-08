---
"@thomasfosterau/effect-payments-stripe": patch
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

The doc-comment examples now compile and run as written (#94).

- The Stripe `Webhook.constructEvent` / `constructEventAsync` examples take the raw body and the `Stripe-Signature` header as parameters instead of naming variables they never declared.
- The examples that call a provider (the Stripe, PayPal and Airwallex entry points, and the Stripe `Customer` and `CheckoutSession` modules) wrap the `Effect.runPromise` call in a function instead of awaiting it at the top level, so copying one no longer sends a request on import.
