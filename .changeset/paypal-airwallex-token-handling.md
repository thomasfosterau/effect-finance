---
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Token and header handling in the PayPal and Airwallex providers:

- Every request sends `Content-Type: application/json`, body or not. PayPal answers a bodyless POST without it, such as `/v1/billing/plans/{id}/activate` (the `Prices.update` activate/deactivate path), with 415; Airwallex gets the same header for consistency.
- Only one login is in flight at a time. Concurrent first requests, and requests racing a token refresh, await that login and get its token, or all fail with its very error (for example the `PaymentNetworkError` of a login timeout) after one `loginTimeout`. A failure is not cached: the next call after it starts a fresh login. If the caller running the login is interrupted, the login is aborted, and the waiting callers try again.
- A 401 from the vendor clears the cached token, but only if it is still the token that request used, so the next request logs in again. A late 401 for a token another request has already replaced leaves the new token in place.
