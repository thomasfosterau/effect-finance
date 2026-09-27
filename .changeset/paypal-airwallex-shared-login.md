---
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Share an in-flight login's outcome with every caller waiting on it.

The token login used to run under a one-permit semaphore. After a failed or timed-out login, each queued caller made its own attempt, so the k-th caller could wait about k × `loginTimeout`. Now the callers that arrive while a login is in flight await that login and get its token, or all fail with its very error (for example the `PaymentNetworkError` of a login timeout) after one `loginTimeout`. A failure is not cached: the next call after it starts a fresh login. If the caller running the login is interrupted, the login is aborted as before, and the waiting callers try again rather than being left waiting.
