---
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Fix a regression and close two gaps in the PayPal and Airwallex providers:

- **Regression fixed:** every request sends `Content-Type: application/json` again, body or not, as it did before the move to `HttpClient`. Without it, PayPal answers a bodyless POST such as `/v1/billing/plans/{id}/activate` (the `Prices.update` activate/deactivate path) with 415. Airwallex gets the same header for consistency.
- The token handshake is serialised. Concurrent first requests, or requests racing a token refresh, now log in once and share the token instead of each logging in.
- A 401 from the vendor clears the cached token, but only if it is still the token that request used, so the next request logs in again. A late 401 for a token another request has already replaced leaves the new token in place.
