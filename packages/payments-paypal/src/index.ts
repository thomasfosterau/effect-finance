/**
 * `@thomasfosterau/effect-payments-paypal`
 *
 * A PayPal implementation of the vendor-neutral
 * `@thomasfosterau/effect-payments` core. It provides:
 *
 * - **`PayPal`** — the PayPal client service (OAuth handshake + HTTP) and the
 *   `Layer`s that construct it from configuration or the environment.
 * - **`PayPalPayments`** — `Layer`s that implement the `Products`, `Prices`,
 *   `PaymentIntents`, `Subscriptions` and `Refunds` capabilities on top of
 *   PayPal, plus `layer`/`layerFromEnv` bundles.
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

export * as PayPal from "./PayPal.js";
export * as PayPalPayments from "./PayPalPayments.js";

export type { PayPalConfig, PayPalEnvironment, PayPalRequest } from "./PayPal.js";
