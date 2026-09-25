---
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Fix three regressions and gaps in the PayPal and Airwallex clients:

- Every request sends `Content-Type: application/json` again, body or not, as it did before the move to `HttpClient`. PayPal answers a bodyless POST such as `/v1/billing/plans/{id}/activate` (the `Prices.update` activate/deactivate path) with 415 without it.
- The token handshake is serialised, so concurrent first requests (or requests racing a token refresh) log in once and share the token instead of each logging in.
- A 401 from the vendor clears the cached token, so the next request logs in again instead of replaying the rejected token until its advertised expiry.
