/**
 * `@thomasfosterau/effect-payments-airwallex`
 *
 * An Airwallex implementation of the vendor-neutral
 * `@thomasfosterau/effect-payments` core. It provides:
 *
 * - **`Airwallex`** — the Airwallex client service (token handshake + HTTP) and
 *   the `Layer`s that construct it from configuration or the environment.
 * - **`AirwallexPayments`** — `Layer`s that implement the `Customers`,
 *   `PaymentIntents` and `Refunds` capabilities on top of Airwallex, plus
 *   `layer`/`layerFromEnv` that bundle the client and capabilities together.
 *
 * Airwallex does not model catalogs or subscription billing in the same shape as
 * the core, so it intentionally implements only a subset of the capabilities.
 * The same neutral program runs on Airwallex or Stripe — only the provided layer
 * changes.
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as Customer from "@thomasfosterau/effect-payments/Customer";
 * import * as AirwallexPayments from "@thomasfosterau/effect-payments-airwallex/AirwallexPayments";
 *
 * const program = Customer.create({ email: "jane@example.com" });
 *
 * const layer = AirwallexPayments.layer({
 *   clientId: "...",
 *   apiKey: Redacted.make("..."),
 * }).pipe(Layer.provide(FetchHttpClient.layer));
 * const customer = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 *
 * @module
 */

export * as Payments from "@thomasfosterau/effect-payments";

export * as Airwallex from "./Airwallex.js";
export * as AirwallexPayments from "./AirwallexPayments.js";

export type { AirwallexConfig, AirwallexEnvironment, AirwallexRequest } from "./Airwallex.js";
