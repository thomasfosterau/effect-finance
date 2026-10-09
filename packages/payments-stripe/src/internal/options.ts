import { Effect } from "effect";
import { PaymentInvalidRequestError } from "@thomasfosterau/effect-payments";

/**
 * Refuse an empty per-call option before anything is sent. An empty
 * `idempotencyKey` would suppress the client's generated key and send an
 * empty header, leaving the `POST` unprotected; an empty `stripeAccount` would
 * send an empty `Stripe-Account`, and an empty `apiVersion` an empty
 * `Stripe-Version`. Failing with `PaymentInvalidRequestError` beats silently
 * treating any of them as absent.
 */
export const checkOptions = (options: {
  readonly idempotencyKey?: string | undefined;
  readonly stripeAccount?: string | undefined;
  readonly apiVersion?: string | undefined;
}): Effect.Effect<void, PaymentInvalidRequestError> => {
  for (const name of ["idempotencyKey", "stripeAccount", "apiVersion"] as const) {
    if (options[name] === "") {
      return Effect.fail(
        new PaymentInvalidRequestError({ message: `${name} must not be empty`, param: name }),
      );
    }
  }
  return Effect.void;
};
