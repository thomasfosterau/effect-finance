import { Context, Effect, Layer } from "effect";
import Stripe from "stripe";
import { StripeConfigError } from "./errors.js";

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
 * The Stripe service provides access to the Stripe API client
 */
export class StripeService extends Context.Tag("Stripe")<
  StripeService,
  Stripe
>() {}

/**
 * Create a Stripe client from configuration
 */
export const make = (
  config: StripeConfig
): Effect.Effect<Stripe, StripeConfigError> =>
  Effect.gen(function* () {
    if (!config.apiKey) {
      yield* Effect.fail(
        new StripeConfigError({
          message: "Stripe API key is required",
        })
      );
    }

    return new Stripe(config.apiKey, {
      apiVersion:
        (config.apiVersion as Stripe.LatestApiVersion) || "2025-02-24.acacia",
      maxNetworkRetries: config.maxNetworkRetries,
      timeout: config.timeout,
      appInfo: config.appInfo,
    });
  });

/**
 * Create a Stripe service layer from configuration
 */
export const layer = (
  config: StripeConfig
): Layer.Layer<StripeService, StripeConfigError> =>
  Layer.effect(StripeService, make(config));

/**
 * Create a Stripe service layer from environment variable
 */
export const layerFromEnv = (
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

      return new Stripe(apiKey!, {
        apiVersion: "2025-02-24.acacia",
      });
    })
  );
