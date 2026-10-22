---
"@thomasfosterau/effect-payments": patch
"@thomasfosterau/effect-payments-stripe": patch
---

The `IdempotencyKey` retry contract (one key per logical write, which operations take one, which errors are safe to retry, the provider deduplication windows) is in the JSDoc of the `IdempotencyKey` schema, and the webhook verification notes (pass the raw body bytes, answer every refusal with a bare 400, the tolerance window, the SDK-based verifier as the alternative) are in the JSDoc of `Webhook.verify`, so both show on hover from the published declarations. No behaviour changes.
