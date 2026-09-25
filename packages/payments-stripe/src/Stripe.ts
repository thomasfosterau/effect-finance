import { Context, Effect, Layer } from "effect";
import Stripe from "stripe";
import { PaymentConfigError } from "@thomasfosterau/effect-payments";
import { omitUndefined } from "./internal/omitUndefined.js";

/**
 * Default Stripe API version
 */
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
export class StripeService extends Context.Tag("Stripe")<StripeService, Stripe>() {}

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
      return yield* Effect.fail(
        new PaymentConfigError({
          message: "Stripe API key is required",
        }),
      );
    }

    return new Stripe(
      config.apiKey,
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
 * Create a Stripe service layer from environment variable
 */
export const layerFromEnv = (
  envVar: string = "STRIPE_API_KEY",
): Layer.Layer<StripeService, PaymentConfigError> =>
  Layer.effect(
    StripeService,
    Effect.gen(function* () {
      const apiKey = process.env[envVar];

      if (!apiKey) {
        return yield* Effect.fail(
          new PaymentConfigError({
            message: `Environment variable ${envVar} is not set`,
          }),
        );
      }

      return new Stripe(apiKey, {
        apiVersion: DEFAULT_API_VERSION,
      });
    }),
  );
