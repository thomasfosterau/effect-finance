/**
 * Issuing Card resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IssuingCard from "@thomasfosterau/effect-payments-stripe/Issuing.Card";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createCard = (cardholderId: string) =>
 *   IssuingCard.create({
 *     cardholder: cardholderId,
 *     currency: "usd",
 *     type: "virtual",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const card = yield* createCard("ich_xxx");
 *   return card;
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
 * Request to create an issuing card
 */
interface CreateCardRequest extends Request.Request<
  Stripe.Issuing.Card,
  StripeError
> {
  readonly _tag: "CreateCardRequest";
  readonly params: Stripe.Issuing.CardCreateParams;
}

const CreateCardRequest =
  Request.tagged<CreateCardRequest>("CreateCardRequest");

const CreateCardResolver: RequestResolver.RequestResolver<
  CreateCardRequest,
  StripeService
> = makeStripeResolver<CreateCardRequest>((stripe, request) =>
  stripe.issuing.cards.create(request.params)
);

/**
 * Request to retrieve an issuing card
 */
interface RetrieveCardRequest extends Request.Request<
  Stripe.Issuing.Card,
  StripeError
> {
  readonly _tag: "RetrieveCardRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.CardRetrieveParams;
}

const RetrieveCardRequest = Request.tagged<RetrieveCardRequest>(
  "RetrieveCardRequest"
);

const RetrieveCardResolver: RequestResolver.RequestResolver<
  RetrieveCardRequest,
  StripeService
> = makeStripeResolver<RetrieveCardRequest>((stripe, request) =>
  stripe.issuing.cards.retrieve(request.id, request.params)
);

/**
 * Request to update an issuing card
 */
interface UpdateCardRequest extends Request.Request<
  Stripe.Issuing.Card,
  StripeError
> {
  readonly _tag: "UpdateCardRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.CardUpdateParams;
}

const UpdateCardRequest =
  Request.tagged<UpdateCardRequest>("UpdateCardRequest");

const UpdateCardResolver: RequestResolver.RequestResolver<
  UpdateCardRequest,
  StripeService
> = makeStripeResolver<UpdateCardRequest>((stripe, request) =>
  stripe.issuing.cards.update(request.id, request.params)
);

/**
 * Request to list issuing cards
 */
interface ListCardsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Issuing.Card>,
  StripeError
> {
  readonly _tag: "ListCardsRequest";
  readonly params?: Stripe.Issuing.CardListParams;
}

const ListCardsRequest = Request.tagged<ListCardsRequest>("ListCardsRequest");

const ListCardsResolver: RequestResolver.RequestResolver<
  ListCardsRequest,
  StripeService
> = makeStripeResolver<ListCardsRequest>((stripe, request) =>
  stripe.issuing.cards.list(request.params)
);

/**
 * Create an issuing card
 */
export const create = (
  params: Stripe.Issuing.CardCreateParams
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeService> =>
  Effect.request(
    CreateCardRequest({ params }),
    RequestResolver.contextFromEffect(CreateCardResolver)
  );

/**
 * Retrieve an issuing card
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.CardRetrieveParams
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeService> =>
  Effect.request(
    RetrieveCardRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveCardResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update an issuing card
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.CardUpdateParams
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeService> =>
  Effect.request(
    UpdateCardRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateCardResolver)
  );

/**
 * List issuing cards
 */
export const list = (
  params?: Stripe.Issuing.CardListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Issuing.Card>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListCardsRequest({ params }),
    RequestResolver.contextFromEffect(ListCardsResolver)
  ).pipe(Effect.withRequestCaching(true));
