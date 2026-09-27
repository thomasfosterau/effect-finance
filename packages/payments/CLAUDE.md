# packages/payments — `@thomasfosterau/effect-payments`

The vendor-neutral core. Peer: `effect` only. No HTTP code, no vendor SDK, no provider vocabulary.

## Terms

- **Capability** — one `Context.Service` per resource family (`Customers`, `Products`, `Prices`, `PaymentIntents`, `Subscriptions`, `Refunds`, `CheckoutSessions`, `BillingPortalSessions`), with module-level accessors (`Customer.create`, …). A provider supplies a `Layer` per capability; a program depends only on the capabilities it uses, so a provider may implement a subset (PayPal has no `Customers`).
- **Neutral entity** — a `Schema.Class` (`Customer`, `Product`, `Price`, …) in camelCase with amounts in **minor units** (`Money.amount` in cents for USD). A provider maps its own shape onto it.
- **Page** — `Page<A>`, the one pagination shape (`data`, `hasMore`; the next page is requested with a `startingAfter` cursor on the list params); `Deleted` for `del` results.
- **Error channel** — `PaymentsError`, the union of the `Schema.TaggedError` classes in `PaymentsError.ts` (`PaymentProviderError`, `PaymentAuthenticationError`, `PaymentRateLimitError`, `PaymentInvalidRequestError`, `PaymentNetworkError`, `PaymentConfigError`, `SignatureVerificationError`). Every capability method fails with it and nothing else.

## Local invariants

- **Amounts are minor units everywhere in the core.** Major-unit conversion (PayPal decimal strings, Airwallex decimals) happens inside the provider.
- **Optional fields are `?: T | undefined`** (the workspace compiles with `exactOptionalPropertyTypes`).
- **Hosted sessions never take an amount.** `CheckoutSession.create` names price ids; what the buyer pays is the provider's price. Both hosted capabilities return an entity whose `url` is required, so a provider answering without one fails rather than inventing a redirect.
- **Adding a capability** means a new module here, a new `exports` entry, and an implementation or an explicit unsupported failure in every provider. A provider without the capability exports a stub layer failing with `PaymentInvalidRequestError` ("<Provider> does not support …", the same failure as an unsupported operation) and leaves it out of its `capabilities` bundle, so the gap still shows at compile time by default.

## Boundary

Imports nothing from this workspace (`.fallowrc.json` zone `core`, no outbound rule). Every provider imports it through its published `exports` (so through `dist/`).
