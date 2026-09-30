# packages/payments — `@thomasfosterau/effect-payments`

The vendor-neutral core. Peer: `effect` only. No HTTP code, no vendor SDK, no provider vocabulary.

## Terms

- **Capability** — one `Context.Service` per resource family (`Customers`, `Products`, `Prices`, `PaymentIntents`, `Subscriptions`, `Refunds`, `CheckoutSessions`, `BillingPortalSessions`), with module-level accessors (`Customer.create`, …). A provider supplies a `Layer` per capability; a program depends only on the capabilities it uses, so a provider may implement a subset (PayPal has no `Customers`).
- **Neutral entity** — a `Schema.Class` (`Customer`, `Product`, `Price`, …) in camelCase with amounts in **minor units** (`Money.amount` in cents for USD). A provider maps its own shape onto it.
- **Lenient enumeration** — every neutral status or type (`PaymentStatus`, `SubscriptionStatus`, `RefundStatus`, `PriceType`, `RecurringInterval`) is `Known | Other` (`Enumeration.ts`): the known literals stay bare strings (`"succeeded"`), and `Other` is the one shared tagged catch-all `{ _tag: "Other", raw: string }` for a provider value the library does not model. Each enumeration exports its literals as `Known<Name>` (the type to use for request filters and params, which can only name a known value) and the lenient union as `<Name>` (the type of the entity field). A provider decoder never fails on an unrecognised enumeration value, and one such value never fails a list page: Stripe's wire schemas use `Enumeration.fromWire(Known<Name>)`, and PayPal / Airwallex map their own spellings with a `to*Status` that returns `Enumeration.other(raw)` in its `default` branch. An exhaustive match over an entity field must handle `Other` (`Enumeration.isOther`, or `value._tag === "Other"`).
- **Page** — `Page<A>`, the one pagination shape (`data`, `hasMore`; the next page is requested with a `startingAfter` cursor on the list params); `Deleted` for `del` results.
- **Error channel** — `PaymentsError`, the union of the `Schema.TaggedError` classes in `PaymentsError.ts` (`PaymentProviderError`, `PaymentAuthenticationError`, `PaymentRateLimitError`, `PaymentInvalidRequestError`, `PaymentNetworkError`, `PaymentsUnavailable`, plus `PaymentConfigError` and `SignatureVerificationError`, which are outside the union). Every capability method fails with it and nothing else.
- **"Not configured ≡ down"** — `PaymentsUnavailable`: no provider can serve the call, typically because its credential is absent. Raised at CALL time, never while a layer is built, so an application without payments configured still starts; it looks to the program exactly like a provider outage (an HTTP API answers it with a 503).
- **Stub** — `Stub.ts`: capability layers whose every call fails with one given `Effect` (`Stub.layer`, one constructor per capability, `Stub.unavailable`). Providers build their unsupported-capability layers from it.

## Local invariants

- **Amounts are minor units everywhere in the core.** Major-unit conversion (PayPal decimal strings, Airwallex decimals) happens inside the provider.
- **A new enumeration is lenient from the start.** Declare `Known<Name> = Schema.Literals([...])`, export `<Name> = Enumeration.lenient(Known<Name>)`, and have every provider produce `Other` for a value it cannot map; never add a closed `Schema.Literals` to an entity field a provider fills from a response. Request-only inputs (a filter, `CheckoutMode`) stay closed.
- **Optional fields are `?: T | undefined`** (the workspace compiles with `exactOptionalPropertyTypes`).
- **Hosted sessions never take an amount.** `CheckoutSession.create` names price ids; what the buyer pays is the provider's price. Both hosted capabilities return an entity whose `url` is required, so a provider answering without one fails rather than inventing a redirect.
- **Adding a capability** means a new module here, a new `exports` entry, and an implementation or an explicit unsupported failure in every provider. A new capability also gets a constructor in `Stub.ts` and a place in `Stub.layer`. A provider without the capability exports a stub layer (built with `Stub`) failing with `PaymentInvalidRequestError` ("<Provider> does not support …", the same failure as an unsupported operation) and leaves it out of its `capabilities` bundle, so the gap still shows at compile time by default.

## Boundary

Imports nothing from this workspace (`.fallowrc.json` zone `core`, no outbound rule). Every provider imports it through its published `exports` (so through `dist/`).
