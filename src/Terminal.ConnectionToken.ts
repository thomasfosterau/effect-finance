/**
 * Terminal ConnectionToken resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as TerminalConnectionToken from "@thomasfosterau/effect-stripe/Terminal.ConnectionToken";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
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

import { Effect, Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import { makeStripeResolver, type StripeError } from "./internal/index.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to create a terminal connection token
 */
interface CreateConnectionTokenRequest extends Request.Request<
  Stripe.Terminal.ConnectionToken,
  StripeError
> {
  readonly _tag: "CreateConnectionTokenRequest";
  readonly params?: Stripe.Terminal.ConnectionTokenCreateParams;
}

const CreateConnectionTokenRequest =
  Request.tagged<CreateConnectionTokenRequest>("CreateConnectionTokenRequest");

const CreateConnectionTokenResolver: RequestResolver.RequestResolver<
  CreateConnectionTokenRequest,
  StripeService
> = makeStripeResolver<CreateConnectionTokenRequest>((stripe, request) =>
  stripe.terminal.connectionTokens.create(request.params)
);

/**
 * Create a terminal connection token
 *
 * Connection tokens are short-lived credentials that authenticate the Stripe Terminal SDK
 * to communicate with a reader. They should be generated on-demand from your backend
 * whenever the Terminal SDK needs to connect to a reader.
 */
export const create = (
  params?: Stripe.Terminal.ConnectionTokenCreateParams
): Effect.Effect<Stripe.Terminal.ConnectionToken, StripeError, StripeService> =>
  Effect.request(
    CreateConnectionTokenRequest({ params }),
    RequestResolver.contextFromEffect(CreateConnectionTokenResolver)
  );
