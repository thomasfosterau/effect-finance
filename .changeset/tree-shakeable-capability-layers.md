---
"@thomasfosterau/effect-payments-stripe": patch
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Bundlers can drop the capabilities a program does not use. A bundle that imports one capability layer no longer carries the other capabilities' request code or response decoders.

- **Airwallex:** `AirwallexPayments` imports the core's capability modules by subpath, as namespaces, and its top-level layer constructions are `/* @__PURE__ */`. A bundle of `customersLayer` alone (esbuild, minified, `effect` external) shrinks from 15.3 KB to 4.7 KB.
- **Stripe, PayPal and Airwallex:** the response decoders and the wire schemas behind them (`internal/mapping`) are `/* @__PURE__ */`, and they import `Schema` and the core modules by subpath, as namespaces. Each single-capability bundle loses the other capabilities' decoders: about 8 KB for Stripe and 7 to 9 KB for PayPal.

Behaviour is unchanged.
