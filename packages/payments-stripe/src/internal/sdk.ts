import { Context } from "effect";
import type Stripe from "stripe";

/**
 * The official `stripe` SDK client, for the optional SDK transport (`Stripe`)
 * and the SDK-based webhook verifier (`Webhook`).
 *
 * Declared apart from `Stripe.ts` so that a module needing only the tag (the
 * webhook verifier) does not import the SDK at runtime: the SDK is an
 * optional peer, loaded only by a program that builds its client.
 */
export class StripeService extends Context.Service<StripeService, Stripe>()(
  "@effect-payments-stripe/StripeService",
) {}
