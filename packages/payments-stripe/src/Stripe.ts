/**
 * The official `stripe` SDK as an **optional alternative transport**.
 *
 * The resource modules and capability layers run on the fetch-only
 * {@link StripeHttp} transport by default (see `StripeHttp`). This module
 * builds an SDK client instead and provides the same {@link StripeHttp}
 * service over `stripe.rawRequest`, plus the client itself as
 * {@link StripeService} (which the SDK-based `Webhook` verifier needs).
 *
 * `stripe` is an optional peer dependency: install it to use this module.
 * Nothing else in the package loads it at runtime, so a program that never
 * imports `@thomasfosterau/effect-payments-stripe/Stripe` ships without it.
 *
 * @module
 */

import { Config, Effect, Layer, Redacted } from "effect";
import Stripe from "stripe";
import {
  PaymentConfigError,
  PaymentProviderError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { PROVIDER, retryAfterOf, toPaymentsError } from "./internal/error.js";
import { encodeForm } from "./internal/form.js";
import { omitUndefined } from "./internal/omitUndefined.js";
import { StripeService } from "./internal/sdk.js";
import { DEFAULT_API_VERSION, StripeHttp, type StripeRequest } from "./StripeHttp.js";

export { StripeService };

/**
 * Configuration for the SDK transport.
 */
export interface StripeConfig {
  /** The secret (or restricted) API key, `sk_…` / `rk_…`. */
  readonly apiKey: Redacted.Redacted<string>;
  /** The `Stripe-Version` to pin. Defaults to the fetch transport's. */
  readonly apiVersion?: string | undefined;
  readonly maxNetworkRetries?: number | undefined;
  readonly timeout?: number | undefined;
  readonly appInfo?: Stripe.AppInfo | undefined;
}

/**
 * Alias for {@link StripeService} using the conventional provider-client name.
 */
export const StripeClient = StripeService;

/** A header value as the SDK reports it (a string, or absent). */
const headerOf = (
  headers: Readonly<Record<string, unknown>> | undefined,
  name: string,
): string | undefined => {
  const value = headers?.[name] ?? headers?.[name.toLowerCase()];
  return value === undefined ? undefined : String(value);
};

/**
 * Convert a thrown SDK error into a vendor-neutral payments error, through
 * the same mapping the fetch transport applies.
 */
const handleStripeError = (error: unknown): PaymentsError => {
  if (error instanceof Stripe.errors.StripeError) {
    const { message, type, code, statusCode, raw } = error;
    return toPaymentsError({
      kind: type,
      message,
      code,
      statusCode,
      param: error instanceof Stripe.errors.StripeInvalidRequestError ? error.param : undefined,
      retryAfter:
        error instanceof Stripe.errors.StripeRateLimitError
          ? retryAfterOf(headerOf(error.headers, "Retry-After"))
          : undefined,
      raw: type === "StripeConnectionError" ? error : raw,
    });
  }
  return new PaymentProviderError({
    message: error instanceof Error ? error.message : String(error),
    provider: PROVIDER,
    cause: error,
  });
};

/**
 * {@link StripeHttp} over an SDK client: `stripe.rawRequest` for every call
 * (the query encoded into the path for a `GET` / `DELETE`, which
 * `rawRequest` requires), and the Files API through `stripe.files.create`.
 */
export const transport = (stripe: Stripe): StripeHttp["Service"] =>
  StripeHttp.of({
    request: (request: StripeRequest) =>
      Effect.tryPromise({
        try: (): Promise<unknown> => {
          const options = omitUndefined({
            idempotencyKey: request.idempotencyKey,
            stripeAccount: request.stripeAccount,
          });
          if (request.upload) {
            // SAFETY: an upload's parameters are the Files API's; the
            // resource module (`File.create`) types them as such.
            return stripe.files.create(request.params as Stripe.FileCreateParams, options);
          }
          if (request.method === "POST") {
            // SAFETY: `rawRequest` form-encodes any object, as the SDK's
            // resource methods do.
            const params = request.params as Record<string, unknown> | undefined;
            return stripe.rawRequest(request.method, request.path, params, options);
          }
          const query = encodeForm(request.params);
          const target = query === "" ? request.path : `${request.path}?${query}`;
          return stripe.rawRequest(request.method, target, undefined, options);
        },
        catch: handleStripeError,
      }),
  });

/**
 * Create a Stripe SDK client from configuration.
 */
export const make = (config: StripeConfig): Effect.Effect<Stripe, PaymentConfigError> =>
  Effect.gen(function* () {
    const apiKey = Redacted.value(config.apiKey);
    if (!apiKey) {
      return yield* new PaymentConfigError({
        message: "Stripe API key is required",
      });
    }

    return new Stripe(
      apiKey,
      // SAFETY: a pinned version is any published version string; Stripe
      // rejects an unknown one on the first call.
      omitUndefined({
        apiVersion: (config.apiVersion || DEFAULT_API_VERSION) as Stripe.LatestApiVersion,
        maxNetworkRetries: config.maxNetworkRetries,
        timeout: config.timeout,
        appInfo: config.appInfo,
      }),
    );
  });

/** The client as {@link StripeService}, and {@link StripeHttp} over it. */
const provideClient = <E, R>(
  client: Effect.Effect<Stripe, E, R>,
): Layer.Layer<StripeService | StripeHttp, E, R> =>
  Layer.provideMerge(
    Layer.effect(StripeHttp, Effect.map(StripeService, transport)),
    Layer.effect(StripeService, client),
  );

/**
 * The SDK transport as a layer: the SDK client ({@link StripeService}) and
 * {@link StripeHttp} over it, from configuration.
 */
export const layer = (
  config: StripeConfig,
): Layer.Layer<StripeService | StripeHttp, PaymentConfigError> => provideClient(make(config));

/**
 * The SDK transport with its key read from a configuration variable (through
 * the current `ConfigProvider`, which defaults to the process environment),
 * at the default API version.
 */
export const layerFromEnv = (
  envVar: string = "STRIPE_API_KEY",
): Layer.Layer<StripeService | StripeHttp, PaymentConfigError> =>
  provideClient(
    Effect.gen(function* () {
      const apiKey = yield* Config.Redacted(envVar).pipe(Config.withDefault(Redacted.make("")));
      if (Redacted.value(apiKey) === "") {
        return yield* new PaymentConfigError({
          message: `Environment variable ${envVar} is not set`,
        });
      }
      return yield* make({ apiKey });
    }).pipe(
      Effect.catchTag("ConfigError", (error) =>
        Effect.fail(new PaymentConfigError({ message: error.message })),
      ),
    ),
  );
