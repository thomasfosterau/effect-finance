# packages/payments-stripe — `@thomasfosterau/effect-payments-stripe`

Stripe: the neutral capabilities as `Layer`s (`StripePayments`) plus one resource module per Stripe API resource as a provider escape hatch. Peer: `effect`. Dependencies: the core, and — for now — the official `stripe` SDK.

## Terms

- **Client** — `StripeService` (`Stripe.ts`, a `Context.Service`), holding an SDK instance built by `Stripe.make` / `Stripe.layer` / `Stripe.layerFromEnv` (`STRIPE_API_KEY` by default, read through `Config`), with the API version pinned (`DEFAULT_API_VERSION`) unless the config overrides it.
- **Resource module** — `Customer.ts`, `Treasury.FinancialAccount.ts`, …: `create` / `retrieve` / `update` / `del` / `list` as the resource supports, each one `wrapStripeCall((stripe) => stripe.<resource>.<method>(…))` (`internal/index.ts`). Results are the SDK's own types. (Before Effect 4 each operation went through a `Request` + `RequestResolver` pair with request caching on reads; Effect 4 dropped request caching, and a per-call resolver batched nothing, so #38 removed them.)
- **Capability layers** — `StripePayments.customersLayer` … `refundsLayer`, `capabilities` (all of them over an existing client), `layer` / `layerFromEnv` (client + capabilities). They map neutral params onto SDK params and SDK objects onto neutral entities (`internal/mapping.ts`).
- **Webhook** — `Webhook.constructEvent` / `constructEventAsync` wrap the SDK verifier today; a WebCrypto verifier becomes the default in #41.

## Local invariants

- **SDK errors become neutral errors in one place**: `handleStripeError` (`internal/index.ts`). A resource module never throws and never leaks an SDK error class.
- **Options objects bound for the SDK go through `omitUndefined`** (`internal/omitUndefined.ts`): the SDK's parameter types declare bare `?: T`, which `exactOptionalPropertyTypes` will not let an assembled `T | undefined` satisfy. The SDK skips `undefined` values when form-encoding anyway, so the wire format is unchanged.
- **The SDK is on its way out of the required surface.** gardeneria cannot ship it in a Worker; #39 adds a fetch-only `StripeHttp` transport over `HttpClient` and demotes the SDK to an optional alternative. Do not deepen the SDK dependency in the meantime.

## Boundary

Imports only `@thomasfosterau/effect-payments` from this workspace (`.fallowrc.json` zone `stripe`, allow `core`).
