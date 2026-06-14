/**
 * Customer resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Customer from "@thomasfosterau/effect-payments-stripe/Customer";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createCustomer = (email: string) =>
 *   Customer.create({ email, name: "John Doe" });
 *
 * const program = Effect.gen(function* () {
 *   const customer = yield* createCustomer("customer@example.com");
 *   return customer;
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
 * Request to create a customer
 */
interface CreateCustomerRequest extends Request.Request<
  Stripe.Customer,
  StripeError
> {
  readonly _tag: "CreateCustomerRequest";
  readonly params?: Stripe.CustomerCreateParams;
}

const CreateCustomerRequest = Request.tagged<CreateCustomerRequest>(
  "CreateCustomerRequest"
);

const CreateCustomerResolver: RequestResolver.RequestResolver<
  CreateCustomerRequest,
  StripeService
> = makeStripeResolver<CreateCustomerRequest>((stripe, request) =>
  stripe.customers.create(request.params)
);

/**
 * Request to retrieve a customer
 */
interface RetrieveCustomerRequest extends Request.Request<
  Stripe.Customer | Stripe.DeletedCustomer,
  StripeError
> {
  readonly _tag: "RetrieveCustomerRequest";
  readonly id: string;
  readonly params?: Stripe.CustomerRetrieveParams;
}

const RetrieveCustomerRequest = Request.tagged<RetrieveCustomerRequest>(
  "RetrieveCustomerRequest"
);

const RetrieveCustomerResolver: RequestResolver.RequestResolver<
  RetrieveCustomerRequest,
  StripeService
> = makeStripeResolver<RetrieveCustomerRequest>((stripe, request) =>
  stripe.customers.retrieve(request.id, request.params)
);

/**
 * Request to update a customer
 */
interface UpdateCustomerRequest extends Request.Request<
  Stripe.Customer,
  StripeError
> {
  readonly _tag: "UpdateCustomerRequest";
  readonly id: string;
  readonly params?: Stripe.CustomerUpdateParams;
}

const UpdateCustomerRequest = Request.tagged<UpdateCustomerRequest>(
  "UpdateCustomerRequest"
);

const UpdateCustomerResolver: RequestResolver.RequestResolver<
  UpdateCustomerRequest,
  StripeService
> = makeStripeResolver<UpdateCustomerRequest>((stripe, request) =>
  stripe.customers.update(request.id, request.params)
);

/**
 * Request to delete a customer
 */
interface DeleteCustomerRequest extends Request.Request<
  Stripe.DeletedCustomer,
  StripeError
> {
  readonly _tag: "DeleteCustomerRequest";
  readonly id: string;
}

const DeleteCustomerRequest = Request.tagged<DeleteCustomerRequest>(
  "DeleteCustomerRequest"
);

const DeleteCustomerResolver: RequestResolver.RequestResolver<
  DeleteCustomerRequest,
  StripeService
> = makeStripeResolver<DeleteCustomerRequest>((stripe, request) =>
  stripe.customers.del(request.id)
);

/**
 * Request to list customers
 */
interface ListCustomersRequest extends Request.Request<
  Stripe.ApiList<Stripe.Customer>,
  StripeError
> {
  readonly _tag: "ListCustomersRequest";
  readonly params?: Stripe.CustomerListParams;
}

const ListCustomersRequest = Request.tagged<ListCustomersRequest>(
  "ListCustomersRequest"
);

const ListCustomersResolver: RequestResolver.RequestResolver<
  ListCustomersRequest,
  StripeService
> = makeStripeResolver<ListCustomersRequest>((stripe, request) =>
  stripe.customers.list(request.params)
);

/**
 * Create a customer
 */
export const create = (
  params?: Stripe.CustomerCreateParams
): Effect.Effect<Stripe.Customer, StripeError, StripeService> =>
  Effect.request(
    CreateCustomerRequest({ params }),
    RequestResolver.contextFromEffect(CreateCustomerResolver)
  );

/**
 * Retrieve a customer
 */
export const retrieve = (
  id: string,
  params?: Stripe.CustomerRetrieveParams
): Effect.Effect<
  Stripe.Customer | Stripe.DeletedCustomer,
  StripeError,
  StripeService
> =>
  Effect.request(
    RetrieveCustomerRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveCustomerResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a customer
 */
export const update = (
  id: string,
  params?: Stripe.CustomerUpdateParams
): Effect.Effect<Stripe.Customer, StripeError, StripeService> =>
  Effect.request(
    UpdateCustomerRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateCustomerResolver)
  );

/**
 * Delete a customer
 */
export const del = (
  id: string
): Effect.Effect<Stripe.DeletedCustomer, StripeError, StripeService> =>
  Effect.request(
    DeleteCustomerRequest({ id }),
    RequestResolver.contextFromEffect(DeleteCustomerResolver)
  );

/**
 * List customers
 */
export const list = (
  params?: Stripe.CustomerListParams
): Effect.Effect<Stripe.ApiList<Stripe.Customer>, StripeError, StripeService> =>
  Effect.request(
    ListCustomersRequest({ params }),
    RequestResolver.contextFromEffect(ListCustomersResolver)
  ).pipe(Effect.withRequestCaching(true));
