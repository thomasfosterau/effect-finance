/**
 * CountrySpec resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as CountrySpec from "@thomasfosterau/effect-stripe/CountrySpec";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const usSpec = yield* CountrySpec.retrieve("US");
 *   const allSpecs = yield* CountrySpec.list({ limit: 10 });
 *   return { usSpec, allSpecs };
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
 * Request to retrieve a country spec
 */
interface RetrieveCountrySpecRequest extends Request.Request<
  Stripe.CountrySpec,
  StripeError
> {
  readonly _tag: "RetrieveCountrySpecRequest";
  readonly country: string;
  readonly params?: Stripe.CountrySpecRetrieveParams;
}

const RetrieveCountrySpecRequest = Request.tagged<RetrieveCountrySpecRequest>(
  "RetrieveCountrySpecRequest"
);

const RetrieveCountrySpecResolver: RequestResolver.RequestResolver<
  RetrieveCountrySpecRequest,
  StripeService
> = makeStripeResolver<RetrieveCountrySpecRequest>((stripe, request) =>
  stripe.countrySpecs.retrieve(request.country, request.params)
);

/**
 * Request to list country specs
 */
interface ListCountrySpecsRequest extends Request.Request<
  Stripe.ApiList<Stripe.CountrySpec>,
  StripeError
> {
  readonly _tag: "ListCountrySpecsRequest";
  readonly params?: Stripe.CountrySpecListParams;
}

const ListCountrySpecsRequest = Request.tagged<ListCountrySpecsRequest>(
  "ListCountrySpecsRequest"
);

const ListCountrySpecsResolver: RequestResolver.RequestResolver<
  ListCountrySpecsRequest,
  StripeService
> = makeStripeResolver<ListCountrySpecsRequest>((stripe, request) =>
  stripe.countrySpecs.list(request.params)
);

/**
 * Retrieve a country spec
 */
export const retrieve = (
  country: string,
  params?: Stripe.CountrySpecRetrieveParams
): Effect.Effect<Stripe.CountrySpec, StripeError, StripeService> =>
  Effect.request(
    RetrieveCountrySpecRequest({ country, params }),
    RequestResolver.contextFromEffect(RetrieveCountrySpecResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * List country specs
 */
export const list = (
  params?: Stripe.CountrySpecListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.CountrySpec>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListCountrySpecsRequest({ params }),
    RequestResolver.contextFromEffect(ListCountrySpecsResolver)
  ).pipe(Effect.withRequestCaching(true));
