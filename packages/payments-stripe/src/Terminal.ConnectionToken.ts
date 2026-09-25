/**
 * Terminal ConnectionToken resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as TerminalConnectionToken from "@thomasfosterau/effect-payments-stripe/Terminal.ConnectionToken";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
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
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create a terminal connection token
 *
 * Connection tokens are short-lived credentials that authenticate the Stripe Terminal SDK
 * to communicate with a reader. They should be generated on-demand from your backend
 * whenever the Terminal SDK needs to connect to a reader.
 */
export const create = (
  params?: Stripe.Terminal.ConnectionTokenCreateParams,
): Effect.Effect<Stripe.Terminal.ConnectionToken, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.terminal.connectionTokens.create(params));
