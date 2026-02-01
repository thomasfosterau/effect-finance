/**
 * Customer Request types and resolvers using Effect's RequestResolver pattern
 *
 * This module defines all Customer-related requests and their resolvers.
 * Requests enable automatic batching, deduplication, and caching.
 */

import { Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import {
  makeStripeResolver,
  type StripeError,
} from "./internal.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to create a customer
 */
export interface CreateCustomerRequest
  extends Request.Request<Stripe.Customer, StripeError> {
  readonly _tag: "CreateCustomerRequest";
  readonly params?: Stripe.CustomerCreateParams;
}

export const CreateCustomerRequest = Request.tagged<CreateCustomerRequest>(
  "CreateCustomerRequest"
);

export const CreateCustomerResolver: RequestResolver.RequestResolver<CreateCustomerRequest, StripeService> =
  makeStripeResolver(
    (stripe, request) => stripe.customers.create(request.params)
  );

/**
 * Request to retrieve a customer
 */
export interface RetrieveCustomerRequest
  extends Request.Request<Stripe.Customer | Stripe.DeletedCustomer, StripeError> {
  readonly _tag: "RetrieveCustomerRequest";
  readonly id: string;
  readonly params?: Stripe.CustomerRetrieveParams;
}

export const RetrieveCustomerRequest = Request.tagged<RetrieveCustomerRequest>(
  "RetrieveCustomerRequest"
);

export const RetrieveCustomerResolver: RequestResolver.RequestResolver<RetrieveCustomerRequest, StripeService> =
  makeStripeResolver(
    (stripe, request) => stripe.customers.retrieve(request.id, request.params)
  );

/**
 * Request to update a customer
 */
export interface UpdateCustomerRequest
  extends Request.Request<Stripe.Customer, StripeError> {
  readonly _tag: "UpdateCustomerRequest";
  readonly id: string;
  readonly params?: Stripe.CustomerUpdateParams;
}

export const UpdateCustomerRequest = Request.tagged<UpdateCustomerRequest>(
  "UpdateCustomerRequest"
);

export const UpdateCustomerResolver: RequestResolver.RequestResolver<UpdateCustomerRequest, StripeService> =
  makeStripeResolver(
    (stripe, request) => stripe.customers.update(request.id, request.params)
  );

/**
 * Request to delete a customer
 */
export interface DeleteCustomerRequest
  extends Request.Request<Stripe.DeletedCustomer, StripeError> {
  readonly _tag: "DeleteCustomerRequest";
  readonly id: string;
}

export const DeleteCustomerRequest = Request.tagged<DeleteCustomerRequest>(
  "DeleteCustomerRequest"
);

export const DeleteCustomerResolver: RequestResolver.RequestResolver<DeleteCustomerRequest, StripeService> =
  makeStripeResolver(
    (stripe, request) => stripe.customers.del(request.id)
  );

/**
 * Request to list customers
 */
export interface ListCustomersRequest
  extends Request.Request<Stripe.ApiList<Stripe.Customer>, StripeError> {
  readonly _tag: "ListCustomersRequest";
  readonly params?: Stripe.CustomerListParams;
}

export const ListCustomersRequest = Request.tagged<ListCustomersRequest>(
  "ListCustomersRequest"
);

export const ListCustomersResolver: RequestResolver.RequestResolver<ListCustomersRequest, StripeService> =
  makeStripeResolver(
    (stripe, request) => stripe.customers.list(request.params)
  );
