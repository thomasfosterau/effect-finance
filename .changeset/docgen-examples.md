---
"@thomasfosterau/effect-payments-stripe": patch
---

The `Webhook.constructEvent` / `constructEventAsync` doc-comment examples now compile and run as written (#94). They take the raw body and the `Stripe-Signature` header as parameters, instead of naming variables they never declared.
