/**
 * Webhook utilities for verifying and processing Stripe webhook events
 *
 * These wrap the official SDK's verifier, so they need its client
 * ({@link StripeService}) from the optional SDK transport (`Stripe.layer`) and
 * the optional `stripe` peer installed. A WebCrypto verifier that needs
 * neither becomes the default in #41.
 *
 * @example
 * ```typescript
 * import { Effect, Redacted } from "effect";
 * import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const handleWebhook = (payload: string | Buffer, signature: string) =>
 *   Effect.gen(function* () {
 *     const event = yield* Webhook.constructEvent(
 *       payload,
 *       signature,
 *       "whsec_..."
 *     );
 *
 *     switch (event.type) {
 *       case "payment_intent.succeeded":
 *         console.log("Payment succeeded:", event.data.object);
 *         break;
 *       // Handle other event types
 *     }
 *
 *     return event;
 *   });
 *
 * const layer = Stripe.layer({ apiKey: Redacted.make("sk_test_...") });
 * const result = await Effect.runPromise(
 *   handleWebhook(payload, signature).pipe(Effect.provide(layer))
 * );
 * ```
 */

import { Effect } from "effect";
import type Stripe from "stripe";
import { SignatureVerificationError } from "@thomasfosterau/effect-payments";
import { omitUndefined } from "./internal/omitUndefined.js";
import { StripeService } from "./internal/sdk.js";

/**
 * Configuration for webhook verification
 */
export interface WebhookConfig {
  /**
   * The webhook endpoint secret (starts with `whsec_`)
   */
  readonly secret: string;

  /**
   * Tolerance in seconds for timestamp verification (default: 300)
   */
  readonly tolerance?: number | undefined;
}

/**
 * Construct an Event from a webhook payload and signature
 *
 * This function verifies the webhook signature and returns the parsed Event object.
 * It uses the Stripe SDK's `constructEvent` method for synchronous verification.
 *
 * @param payload - The raw request body as a string or Buffer
 * @param signature - The Stripe-Signature header value
 * @param secret - The webhook endpoint secret (starts with `whsec_`)
 * @param tolerance - Tolerance in seconds for timestamp verification (default: 300)
 * @returns Effect that resolves to the verified Event object
 *
 * @example
 * ```typescript
 * import { Effect, Redacted } from "effect";
 * import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const event = yield* Webhook.constructEvent(
 *     requestBody,
 *     stripeSignatureHeader,
 *     "whsec_your_secret"
 *   );
 *   console.log("Event type:", event.type);
 *   return event;
 * });
 *
 * const layer = Stripe.layer({ apiKey: Redacted.make("sk_test_...") });
 * await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */
export const constructEvent = (
  payload: string | Buffer,
  signature: string,
  secret: string,
  tolerance: number = DEFAULT_TOLERANCE,
): Effect.Effect<Stripe.Event, SignatureVerificationError, StripeService> =>
  Effect.gen(function* () {
    const stripe = yield* StripeService;

    return yield* Effect.try({
      try: () => stripe.webhooks.constructEvent(payload, signature, secret, tolerance),
      catch: (error) => {
        const message = error instanceof Error ? error.message : String(error);
        const payloadString = typeof payload === "string" ? payload : payload.toString("utf8");
        return new SignatureVerificationError({
          message,
          header: signature,
          payload: payloadString,
        });
      },
    });
  });

/**
 * Construct an Event from a webhook payload and signature (async version)
 *
 * This function verifies the webhook signature asynchronously and returns the parsed Event object.
 * It uses the Stripe SDK's `constructEventAsync` method.
 *
 * @param payload - The raw request body as a string or Buffer
 * @param signature - The Stripe-Signature header value
 * @param secret - The webhook endpoint secret (starts with `whsec_`)
 * @param tolerance - Tolerance in seconds for timestamp verification (default: 300)
 * @param cryptoProvider - Optional custom crypto provider
 * @returns Effect that resolves to the verified Event object
 *
 * @example
 * ```typescript
 * import { Effect, Redacted } from "effect";
 * import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const event = yield* Webhook.constructEventAsync(
 *     requestBody,
 *     stripeSignatureHeader,
 *     "whsec_your_secret"
 *   );
 *   console.log("Event type:", event.type);
 *   return event;
 * });
 *
 * const layer = Stripe.layer({ apiKey: Redacted.make("sk_test_...") });
 * await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */
export const constructEventAsync = (
  payload: string | Buffer,
  signature: string,
  secret: string,
  tolerance: number = DEFAULT_TOLERANCE,
  cryptoProvider?: Stripe.CryptoProvider,
): Effect.Effect<Stripe.Event, SignatureVerificationError, StripeService> =>
  Effect.gen(function* () {
    const stripe = yield* StripeService;

    return yield* Effect.tryPromise({
      try: () =>
        stripe.webhooks.constructEventAsync(payload, signature, secret, tolerance, cryptoProvider),
      catch: (error) => {
        const message = error instanceof Error ? error.message : String(error);
        const payloadString = typeof payload === "string" ? payload : payload.toString("utf8");
        return new SignatureVerificationError({
          message,
          header: signature,
          payload: payloadString,
        });
      },
    });
  });

/**
 * Generate a test header string for testing webhook handling
 *
 * This is useful for testing your webhook handler without needing to
 * trigger real events from Stripe.
 *
 * @param payload - The payload to sign
 * @param secret - The webhook endpoint secret
 * @param timestamp - Optional timestamp (defaults to current time)
 * @returns Effect that resolves to the signature header string
 *
 * @example
 * ```typescript
 * import { Effect, Redacted } from "effect";
 * import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const payload = JSON.stringify({ type: "payment_intent.succeeded" });
 *   const secret = "whsec_test_secret";
 *   const signature = yield* Webhook.generateTestHeaderString(payload, secret);
 *
 *   // Use the signature to test your webhook handler
 *   const event = yield* Webhook.constructEvent(payload, signature, secret);
 *   return event;
 * });
 *
 * const layer = Stripe.layer({ apiKey: Redacted.make("sk_test_...") });
 * await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */
export const generateTestHeaderString = (
  payload: string | Buffer,
  secret: string,
  timestamp?: number,
): Effect.Effect<string, SignatureVerificationError, StripeService> =>
  Effect.gen(function* () {
    const stripe = yield* StripeService;
    return yield* Effect.try({
      try: () =>
        stripe.webhooks.generateTestHeaderString(
          omitUndefined({
            payload: typeof payload === "string" ? payload : payload.toString("utf8"),
            secret,
            timestamp,
          }),
        ),
      catch: (error) => {
        const message = error instanceof Error ? error.message : String(error);
        const payloadString = typeof payload === "string" ? payload : payload.toString("utf8");
        return new SignatureVerificationError({
          message,
          header: undefined,
          payload: payloadString,
        });
      },
    });
  });

/**
 * Generate a test header string for testing webhook handling (async version)
 *
 * This is useful for testing your webhook handler without needing to
 * trigger real events from Stripe. This version uses async cryptography.
 *
 * @param payload - The payload to sign
 * @param secret - The webhook endpoint secret
 * @param timestamp - Optional timestamp (defaults to current time)
 * @param cryptoProvider - Optional custom crypto provider
 * @returns Effect that resolves to the signature header string
 *
 * @example
 * ```typescript
 * import { Effect, Redacted } from "effect";
 * import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const payload = JSON.stringify({ type: "payment_intent.succeeded" });
 *   const secret = "whsec_test_secret";
 *   const signature = yield* Webhook.generateTestHeaderStringAsync(
 *     payload,
 *     secret
 *   );
 *
 *   // Use the signature to test your webhook handler
 *   const event = yield* Webhook.constructEventAsync(
 *     payload,
 *     signature,
 *     secret
 *   );
 *   return event;
 * });
 *
 * const layer = Stripe.layer({ apiKey: Redacted.make("sk_test_...") });
 * await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */
export const generateTestHeaderStringAsync = (
  payload: string | Buffer,
  secret: string,
  timestamp?: number,
  cryptoProvider?: Stripe.CryptoProvider,
): Effect.Effect<string, SignatureVerificationError, StripeService> =>
  Effect.gen(function* () {
    const stripe = yield* StripeService;
    return yield* Effect.tryPromise({
      try: () =>
        stripe.webhooks.generateTestHeaderStringAsync(
          omitUndefined({
            payload: typeof payload === "string" ? payload : payload.toString("utf8"),
            secret,
            timestamp,
            cryptoProvider,
          }),
        ),
      catch: (error) => {
        const message = error instanceof Error ? error.message : String(error);
        const payloadString = typeof payload === "string" ? payload : payload.toString("utf8");
        return new SignatureVerificationError({
          message,
          header: undefined,
          payload: payloadString,
        });
      },
    });
  });

/**
 * Get the default tolerance used for timestamp verification
 *
 * @returns The default tolerance in seconds (300)
 */
export const DEFAULT_TOLERANCE: number = 300;
