---
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Time-box every request the PayPal and Airwallex clients make.

- **The token login now has a timeout** (`loginTimeout` on `PayPalConfig` / `AirwallexConfig`, in milliseconds, default 30 000). Logins run one at a time, so a login the vendor accepted but never answered used to hold the token lock forever and stall every request on the client. A login that runs out of time is aborted and fails with `PaymentNetworkError`, the lock is released, and the next caller logs in afresh.
- **Resource requests now have a timeout too** (`timeout`, in milliseconds, default 80 000 — the Stripe transport's per-attempt default). A request that runs out of time, response body included, is aborted and fails with `PaymentNetworkError`.
