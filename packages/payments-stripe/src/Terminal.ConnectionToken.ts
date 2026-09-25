/**
 * Terminal ConnectionToken resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as TerminalConnectionToken from "@thomasfosterau/effect-payments-stripe/Terminal.ConnectionToken";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createToken = (locationId?: string) =>
 *   TerminalConnectionToken.create(
 *     locationId ? { location: locationId } : undefined
 *   );
 *
 * const program = Effect.gen(function* () {
 *   const token = yield* createToken("tml_123");
 *   return token;
 * });
 *
 * const layer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, stripeRequest } from "./internal/index.js";
import type { StripeHttp } from "./StripeHttp.js";

/**
 * Create a terminal connection token
 *
 * Connection tokens are short-lived credentials that authenticate the Stripe Terminal SDK
 * to communicate with a reader. They should be generated on-demand from your backend
 * whenever the Terminal SDK needs to connect to a reader.
 */
export const create = (
  params?: Stripe.Terminal.ConnectionTokenCreateParams,
): Effect.Effect<Stripe.Terminal.ConnectionToken, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/terminal/connection_tokens", params);
