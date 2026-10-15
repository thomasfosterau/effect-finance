---
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Share an in-flight login's outcome with every caller waiting on it.

The callers that arrive while a login is in flight await that login and get its token, or all fail with its very error (for example the `PaymentNetworkError` of a login timeout) after one `loginTimeout`, rather than each making its own attempt in turn (so the k-th waiting caller could wait about k × `loginTimeout`). A failure is not cached: the next call after it starts a fresh login. If the caller running the login is interrupted, the login is aborted, and the waiting callers try again rather than being left waiting.
