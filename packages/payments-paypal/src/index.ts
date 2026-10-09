/**
 * `@thomasfosterau/effect-payments-paypal`
 *
 * A PayPal implementation of the vendor-neutral
 * `@thomasfosterau/effect-payments` core. It provides:
 *
 * - **`PayPalPayments`** — `Layer`s that implement the `Products`, `Prices`,
 *   `PaymentIntents`, `Subscriptions` and `Refunds` capabilities on top of
 *   Distilled's PayPal operations (`@distilled.cloud/paypal`), plus
 *   `layer`/`layerFromEnv` bundles that log in with the client credentials,
 *   and the `PayPalConfig` / `PayPalEnvironment` types `layer` takes.
 *
 * For a PayPal call the capabilities do not cover, use
 * `@distilled.cloud/paypal`'s operations directly, with an access token of
 * your own in its `Credentials`.
 *
 * PayPal has no first-class customer resource, so it does not implement the
 * core's `Customers` capability. The same neutral program runs on PayPal,
 * Stripe or Airwallex — only the provided layer changes.
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as Product from "@thomasfosterau/effect-payments/Product";
 * import * as PayPalPayments from "@thomasfosterau/effect-payments-paypal/PayPalPayments";
 *
 * const program = Product.create({ name: "Premium" });
 *
 * const layer = PayPalPayments.layer({
 *   clientId: "...",
 *   clientSecret: Redacted.make("..."),
 * }).pipe(Layer.provide(FetchHttpClient.layer));
 * // Calls PayPal when invoked, so it needs real credentials.
 * const run = () => Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 *
 * @module
 */

export * as Payments from "@thomasfosterau/effect-payments";

export * as PayPalPayments from "./PayPalPayments.js";

export type { PayPalConfig, PayPalEnvironment } from "./PayPalPayments.js";
