# packages/payments — `@thomasfosterau/effect-payments`

The vendor-neutral core. Peer: `effect` only. No HTTP code, no vendor SDK, no provider vocabulary.

## Terms

- **Capability** — one `Context` service per resource family (`Customers`, `Products`, `Prices`, `PaymentIntents`, `Subscriptions`, `Refunds`), with module-level accessors (`Customer.create`, …). A provider supplies a `Layer` per capability; a program depends only on the capabilities it uses, so a provider may implement a subset (PayPal has no `Customers`).
- **Neutral entity** — a `Schema.Class` (`Customer`, `Product`, `Price`, …) in camelCase with amounts in **minor units** (`Money.amount` in cents for USD). A provider maps its own shape onto it.
- **Page** — `Page<A>`, the one pagination shape (`data`, `hasMore`; the next page is requested with a `startingAfter` cursor on the list params); `Deleted` for `del` results.
- **Error channel** — `PaymentsError`, the union of the tagged errors in `PaymentsError.ts` (`PaymentProviderError`, `PaymentAuthenticationError`, `PaymentRateLimitError`, `PaymentInvalidRequestError`, `PaymentNetworkError`, `PaymentConfigError`, `SignatureVerificationError`). Every capability method fails with it and nothing else.

## Local invariants

- **Amounts are minor units everywhere in the core.** Major-unit conversion (PayPal decimal strings, Airwallex decimals) happens inside the provider.
- **Optional fields are `?: T | undefined`** (the workspace compiles with `exactOptionalPropertyTypes`).
- **Adding a capability** (Checkout Session, Billing Portal — #40) means a new module here, a new `exports` entry, and an implementation or an explicit unsupported failure in every provider.

## Boundary

Imports nothing from this workspace (`.fallowrc.json` zone `core`, no outbound rule). Every provider imports it through its published `exports` (so through `dist/`).
