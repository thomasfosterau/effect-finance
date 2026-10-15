---
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Time-box every request the PayPal and Airwallex providers make.

- **The token login now has a timeout** (`loginTimeout` on `PayPalConfig` / `AirwallexConfig`, in milliseconds, default 30 000). Only one login is in flight at a time, so a login the vendor accepted but never answered used to stall every request waiting for a token forever. A login that runs out of time is aborted and fails with `PaymentNetworkError` (for every caller waiting on it), and the next caller logs in afresh.
- **Resource requests now have a timeout too** (`timeout`, in milliseconds, default 80 000 — the Stripe client's per-attempt default). A request that runs out of time, response body included, is aborted and fails with `PaymentNetworkError`.
- Both timeouts are checked when the configuration is read (PayPal's `layer`, Airwallex's `make` / `layer`). `Infinity` turns a timeout off. `0`, a negative number or `NaN` fails with `PaymentConfigError`.
- Two limits to know about. `timeout` does not cover getting a token. And a write (a non-GET) that times out has an unknown outcome, so don't blindly retry it without the same `idempotencyKey`.
