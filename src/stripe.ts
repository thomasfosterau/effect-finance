import { Context, Effect, Layer } from "effect";
import Stripe from "stripe";
import {
  StripeApiError,
  StripeAuthenticationError,
  StripeConfigError,
  StripeInvalidRequestError,
  StripeNetworkError,
  StripeRateLimitError,
} from "./errors.js";

/**
 * Configuration for the Stripe service
 */
export interface StripeConfig {
  readonly apiKey: string;
  readonly apiVersion?: string;
  readonly maxNetworkRetries?: number;
  readonly timeout?: number;
  readonly appInfo?: Stripe.AppInfo;
}

/**
 * The Stripe service tag
 */
export class StripeService extends Context.Tag("StripeService")<
  StripeService,
  {
    readonly client: Stripe;
    readonly customers: ReturnType<typeof makeCustomersService>;
    readonly paymentIntents: ReturnType<typeof makePaymentIntentsService>;
    readonly subscriptions: ReturnType<typeof makeSubscriptionsService>;
    readonly prices: ReturnType<typeof makePricesService>;
    readonly products: ReturnType<typeof makeProductsService>;
  }
>() {}

/**
 * Helper function to convert Stripe errors to Effect errors
 */
const handleStripeError = (error: unknown) => {
  if (error instanceof Stripe.errors.StripeError) {
    const { message, type, code, statusCode, raw } = error;

    switch (type) {
      case "StripeAuthenticationError":
        return new StripeAuthenticationError({ message, statusCode });
      case "StripeRateLimitError":
        return new StripeRateLimitError({ message });
      case "StripeInvalidRequestError":
        return new StripeInvalidRequestError({
          message,
          param: (error as Stripe.errors.StripeInvalidRequestError).param,
          statusCode,
        });
      case "StripeConnectionError":
        return new StripeNetworkError({ message, cause: error });
      default:
        return new StripeApiError({
          message,
          type: type || "UnknownError",
          code,
          statusCode,
          raw,
        });
    }
  }

  return new StripeApiError({
    message: error instanceof Error ? error.message : String(error),
    type: "UnknownError",
    raw: error,
  });
};

/**
 * Wraps a Stripe API call in an Effect
 */
const wrapStripeCall = <A>(
  fn: () => Promise<A>
): Effect.Effect<A, StripeApiError | StripeNetworkError> =>
  Effect.tryPromise({
    try: fn,
    catch: handleStripeError,
  });

/**
 * Create the customers service
 */
const makeCustomersService = (stripe: Stripe) => ({
  /**
   * Create a new customer
   */
  create: (
    params?: Stripe.CustomerCreateParams
  ): Effect.Effect<
    Stripe.Customer,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.customers.create(params)),

  /**
   * Retrieve a customer
   */
  retrieve: (
    id: string,
    params?: Stripe.CustomerRetrieveParams
  ): Effect.Effect<
    Stripe.Customer | Stripe.DeletedCustomer,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.customers.retrieve(id, params)),

  /**
   * Update a customer
   */
  update: (
    id: string,
    params?: Stripe.CustomerUpdateParams
  ): Effect.Effect<
    Stripe.Customer,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.customers.update(id, params)),

  /**
   * Delete a customer
   */
  del: (
    id: string
  ): Effect.Effect<
    Stripe.DeletedCustomer,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.customers.del(id)),

  /**
   * List customers
   */
  list: (
    params?: Stripe.CustomerListParams
  ): Effect.Effect<
    Stripe.ApiList<Stripe.Customer>,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.customers.list(params)),
});

/**
 * Create the payment intents service
 */
const makePaymentIntentsService = (stripe: Stripe) => ({
  /**
   * Create a payment intent
   */
  create: (
    params: Stripe.PaymentIntentCreateParams
  ): Effect.Effect<
    Stripe.PaymentIntent,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.paymentIntents.create(params)),

  /**
   * Retrieve a payment intent
   */
  retrieve: (
    id: string,
    params?: Stripe.PaymentIntentRetrieveParams
  ): Effect.Effect<
    Stripe.PaymentIntent,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.paymentIntents.retrieve(id, params)),

  /**
   * Update a payment intent
   */
  update: (
    id: string,
    params?: Stripe.PaymentIntentUpdateParams
  ): Effect.Effect<
    Stripe.PaymentIntent,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.paymentIntents.update(id, params)),

  /**
   * Confirm a payment intent
   */
  confirm: (
    id: string,
    params?: Stripe.PaymentIntentConfirmParams
  ): Effect.Effect<
    Stripe.PaymentIntent,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.paymentIntents.confirm(id, params)),

  /**
   * Cancel a payment intent
   */
  cancel: (
    id: string,
    params?: Stripe.PaymentIntentCancelParams
  ): Effect.Effect<
    Stripe.PaymentIntent,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.paymentIntents.cancel(id, params)),

  /**
   * List payment intents
   */
  list: (
    params?: Stripe.PaymentIntentListParams
  ): Effect.Effect<
    Stripe.ApiList<Stripe.PaymentIntent>,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.paymentIntents.list(params)),
});

/**
 * Create the subscriptions service
 */
const makeSubscriptionsService = (stripe: Stripe) => ({
  /**
   * Create a subscription
   */
  create: (
    params: Stripe.SubscriptionCreateParams
  ): Effect.Effect<
    Stripe.Subscription,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.subscriptions.create(params)),

  /**
   * Retrieve a subscription
   */
  retrieve: (
    id: string,
    params?: Stripe.SubscriptionRetrieveParams
  ): Effect.Effect<
    Stripe.Subscription,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.subscriptions.retrieve(id, params)),

  /**
   * Update a subscription
   */
  update: (
    id: string,
    params?: Stripe.SubscriptionUpdateParams
  ): Effect.Effect<
    Stripe.Subscription,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.subscriptions.update(id, params)),

  /**
   * Cancel a subscription
   */
  cancel: (
    id: string,
    params?: Stripe.SubscriptionCancelParams
  ): Effect.Effect<
    Stripe.Subscription,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.subscriptions.cancel(id, params)),

  /**
   * List subscriptions
   */
  list: (
    params?: Stripe.SubscriptionListParams
  ): Effect.Effect<
    Stripe.ApiList<Stripe.Subscription>,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.subscriptions.list(params)),
});

/**
 * Create the prices service
 */
const makePricesService = (stripe: Stripe) => ({
  /**
   * Create a price
   */
  create: (
    params: Stripe.PriceCreateParams
  ): Effect.Effect<Stripe.Price, StripeApiError | StripeNetworkError> =>
    wrapStripeCall(() => stripe.prices.create(params)),

  /**
   * Retrieve a price
   */
  retrieve: (
    id: string,
    params?: Stripe.PriceRetrieveParams
  ): Effect.Effect<Stripe.Price, StripeApiError | StripeNetworkError> =>
    wrapStripeCall(() => stripe.prices.retrieve(id, params)),

  /**
   * Update a price
   */
  update: (
    id: string,
    params?: Stripe.PriceUpdateParams
  ): Effect.Effect<Stripe.Price, StripeApiError | StripeNetworkError> =>
    wrapStripeCall(() => stripe.prices.update(id, params)),

  /**
   * List prices
   */
  list: (
    params?: Stripe.PriceListParams
  ): Effect.Effect<
    Stripe.ApiList<Stripe.Price>,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.prices.list(params)),
});

/**
 * Create the products service
 */
const makeProductsService = (stripe: Stripe) => ({
  /**
   * Create a product
   */
  create: (
    params: Stripe.ProductCreateParams
  ): Effect.Effect<Stripe.Product, StripeApiError | StripeNetworkError> =>
    wrapStripeCall(() => stripe.products.create(params)),

  /**
   * Retrieve a product
   */
  retrieve: (
    id: string,
    params?: Stripe.ProductRetrieveParams
  ): Effect.Effect<Stripe.Product, StripeApiError | StripeNetworkError> =>
    wrapStripeCall(() => stripe.products.retrieve(id, params)),

  /**
   * Update a product
   */
  update: (
    id: string,
    params?: Stripe.ProductUpdateParams
  ): Effect.Effect<Stripe.Product, StripeApiError | StripeNetworkError> =>
    wrapStripeCall(() => stripe.products.update(id, params)),

  /**
   * Delete a product
   */
  del: (
    id: string
  ): Effect.Effect<
    Stripe.DeletedProduct,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.products.del(id)),

  /**
   * List products
   */
  list: (
    params?: Stripe.ProductListParams
  ): Effect.Effect<
    Stripe.ApiList<Stripe.Product>,
    StripeApiError | StripeNetworkError
  > => wrapStripeCall(() => stripe.products.list(params)),
});

/**
 * Create a Stripe service layer from configuration
 */
export const makeStripeLayer = (
  config: StripeConfig
): Layer.Layer<StripeService, StripeConfigError> =>
  Layer.effect(
    StripeService,
    Effect.gen(function* () {
      if (!config.apiKey) {
        yield* Effect.fail(
          new StripeConfigError({
            message: "Stripe API key is required",
          })
        );
      }

      const stripe = new Stripe(config.apiKey, {
        apiVersion: (config.apiVersion as Stripe.LatestApiVersion) || "2024-12-18.acacia",
        maxNetworkRetries: config.maxNetworkRetries,
        timeout: config.timeout,
        appInfo: config.appInfo,
      });

      return {
        client: stripe,
        customers: makeCustomersService(stripe),
        paymentIntents: makePaymentIntentsService(stripe),
        subscriptions: makeSubscriptionsService(stripe),
        prices: makePricesService(stripe),
        products: makeProductsService(stripe),
      };
    })
  );

/**
 * Create a Stripe service layer from environment variable
 */
export const makeStripeLayerFromEnv = (
  envVar: string = "STRIPE_API_KEY"
): Layer.Layer<StripeService, StripeConfigError> =>
  Layer.effect(
    StripeService,
    Effect.gen(function* () {
      const apiKey = process.env[envVar];

      if (!apiKey) {
        yield* Effect.fail(
          new StripeConfigError({
            message: `Environment variable ${envVar} is not set`,
          })
        );
      }

      const stripe = new Stripe(apiKey!, {
        apiVersion: "2024-12-18.acacia",
      });

      return {
        client: stripe,
        customers: makeCustomersService(stripe),
        paymentIntents: makePaymentIntentsService(stripe),
        subscriptions: makeSubscriptionsService(stripe),
        prices: makePricesService(stripe),
        products: makeProductsService(stripe),
      };
    })
  );
