/**
 * AccountLink resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as AccountLink from "@thomasfosterau/effect-payments-stripe/AccountLink";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createAccountLink = (accountId: string) =>
 *   AccountLink.create({
 *     account: accountId,
 *     type: "account_onboarding",
 *     refresh_url: "https://example.com/reauth",
 *     return_url: "https://example.com/return",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const accountLink = yield* createAccountLink("acct_123");
 *   return accountLink;
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
 * Request to create an account link
 */
interface CreateAccountLinkRequest extends Request.Request<
  Stripe.AccountLink,
  StripeError
> {
  readonly _tag: "CreateAccountLinkRequest";
  readonly params: Stripe.AccountLinkCreateParams;
}

const CreateAccountLinkRequest = Request.tagged<CreateAccountLinkRequest>(
  "CreateAccountLinkRequest"
);

const CreateAccountLinkResolver: RequestResolver.RequestResolver<
  CreateAccountLinkRequest,
  StripeService
> = makeStripeResolver<CreateAccountLinkRequest>((stripe, request) =>
  stripe.accountLinks.create(request.params)
);

/**
 * Create an account link
 */
export const create = (
  params: Stripe.AccountLinkCreateParams
): Effect.Effect<Stripe.AccountLink, StripeError, StripeService> =>
  Effect.request(
    CreateAccountLinkRequest({ params }),
    RequestResolver.contextFromEffect(CreateAccountLinkResolver)
  );
