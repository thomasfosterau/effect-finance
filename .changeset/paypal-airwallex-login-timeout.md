---
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Time-box every request the PayPal and Airwallex providers make.

- **The token login has a timeout** (`loginTimeout` on `PayPalConfig` / `AirwallexConfig`, in milliseconds, default 30 000), so a login the vendor accepted but never answers cannot stall the requests waiting for a token. A login that runs out of time is aborted and fails with `PaymentNetworkError`, and the next caller logs in afresh.
- **Resource requests have a timeout** (`timeout`, in milliseconds, default 80 000 — the Stripe client's per-attempt default). A request that runs out of time, response body included, is aborted and fails with `PaymentNetworkError`.
- Both timeouts are checked when the configuration is read (PayPal's `layer`, Airwallex's `make` / `layer`). `Infinity` turns a timeout off. `0`, a negative number or `NaN` fails with `PaymentConfigError`.
- Two limits to know about. `timeout` does not cover getting a token. And a write (a non-GET) that times out has an unknown outcome, so don't blindly retry it without the same `idempotencyKey`.
