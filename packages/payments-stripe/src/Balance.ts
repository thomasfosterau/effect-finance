/**
 * Balance resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Balance from "@thomasfosterau/effect-payments-stripe/Balance";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const balance = yield* Balance.retrieve();
 *   return balance;
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
 * Request to retrieve the balance
 */
interface RetrieveBalanceRequest extends Request.Request<Stripe.Balance, StripeError> {
  readonly _tag: "RetrieveBalanceRequest";
  readonly params?: Stripe.BalanceRetrieveParams | undefined;
}

const RetrieveBalanceRequest = Request.tagged<RetrieveBalanceRequest>("RetrieveBalanceRequest");

const RetrieveBalanceResolver: RequestResolver.RequestResolver<
  RetrieveBalanceRequest,
  StripeService
> = makeStripeResolver<RetrieveBalanceRequest>((stripe, request) =>
  stripe.balance.retrieve(request.params),
);

/**
 * Retrieve the balance
 */
export const retrieve = (
  params?: Stripe.BalanceRetrieveParams,
): Effect.Effect<Stripe.Balance, StripeError, StripeService> =>
  Effect.request(
    RetrieveBalanceRequest({ params }),
    RequestResolver.contextFromEffect(RetrieveBalanceResolver),
  ).pipe(Effect.withRequestCaching(true));
