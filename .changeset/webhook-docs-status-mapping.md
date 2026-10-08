---
"@thomasfosterau/effect-payments-stripe": patch
---

Align the `Webhook` module example and the README's webhook snippet with `examples/webhooks.ts`. The body is read with `Effect.tryPromise` and a typed error, so an unreadable body gets a 400 and no longer becomes a defect. A signature refusal and a signed body that is not an event envelope each get a 400. A handled event that fails to decode is logged with only its id and type, as log annotations, and gets a 500. Both texts now say that Stripe retries a failed delivery for a limited period only, and that a fix shipped after that needs the event resent from the Dashboard.
