import { Config, Context, Effect, Layer } from "effect";
import Stripe from "stripe";
import { PaymentConfigError } from "@thomasfosterau/effect-payments";
import { omitUndefined } from "./internal/omitUndefined.js";

/**
 * Default Stripe API version
 */
// SAFETY: the pinned version predates the SDK's `LatestApiVersion` literal;
// the API accepts any published version string.
const DEFAULT_API_VERSION = "2025-02-24.acacia" as Stripe.LatestApiVersion;

/**
 * Configuration for the Stripe service
 */
export interface StripeConfig {
  readonly apiKey: string;
  readonly apiVersion?: string | undefined;
  readonly maxNetworkRetries?: number | undefined;
  readonly timeout?: number | undefined;
  readonly appInfo?: Stripe.AppInfo | undefined;
}

/**
 * The Stripe service provides access to the underlying Stripe API client.
 *
 * It is the low-level resource that the Stripe payments provider builds upon:
 * every neutral capability layer (see `StripePayments`) and every raw resource
 * module depends on it.
 */
export class StripeService extends Context.Service<StripeService, Stripe>()(
  "@effect-payments-stripe/StripeService",
) {}

/**
 * Alias for {@link StripeService} using the conventional provider-client name.
 */
export const StripeClient = StripeService;

/**
 * Create a Stripe client from configuration
 */
export const make = (config: StripeConfig): Effect.Effect<Stripe, PaymentConfigError> =>
  Effect.gen(function* () {
    if (!config.apiKey) {
      return yield* new PaymentConfigError({
        message: "Stripe API key is required",
      });
    }

    return new Stripe(
      config.apiKey,
      // SAFETY: a caller-pinned version is any published version string (see
      // DEFAULT_API_VERSION); Stripe rejects an unknown one on the first call.
      omitUndefined({
        apiVersion: (config.apiVersion as Stripe.LatestApiVersion) || DEFAULT_API_VERSION,
        maxNetworkRetries: config.maxNetworkRetries,
        timeout: config.timeout,
        appInfo: config.appInfo,
      }),
    );
  });

/**
 * Create a Stripe service layer from configuration
 */
export const layer = (config: StripeConfig): Layer.Layer<StripeService, PaymentConfigError> =>
  Layer.effect(StripeService, make(config));

/**
 * Create a Stripe service layer from an environment variable (read through the
 * current `ConfigProvider`, which defaults to the process environment), using
 * the default API version.
 */
export const layerFromEnv = (
  envVar: string = "STRIPE_API_KEY",
): Layer.Layer<StripeService, PaymentConfigError> =>
  Layer.effect(
    StripeService,
    Effect.gen(function* () {
      const apiKey = yield* Config.String(envVar).pipe(Config.withDefault(""));
      if (!apiKey) {
        return yield* new PaymentConfigError({
          message: `Environment variable ${envVar} is not set`,
        });
      }
      return new Stripe(apiKey, { apiVersion: DEFAULT_API_VERSION });
    }).pipe(
      Effect.catchTag("ConfigError", (error) =>
        Effect.fail(new PaymentConfigError({ message: error.message })),
      ),
    ),
  );
