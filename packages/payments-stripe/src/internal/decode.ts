import { Effect, Schema } from "effect";
import { PaymentProviderError } from "@thomasfosterau/effect-payments";
import type { StripeHttp, StripeMethod } from "../StripeHttp.js";
import { PROVIDER } from "./error.js";
import { type RequestPath, type StripeError, stripeRequest } from "./index.js";
import type { StripeParams } from "./params.js";

/**
 * The failure for a 2xx whose body is not the shape the pinned spec says:
 * {@link PaymentProviderError} naming the response (`what`), with the decode
 * failure as its cause.
 */
export const malformed = (what: string, cause?: unknown): PaymentProviderError =>
  new PaymentProviderError({
    message: `Stripe returned a malformed ${what} response`,
    provider: PROVIDER,
    cause,
  });

/**
 * {@link stripeRequest} with the response **decoded** at the boundary against a
 * schema generated from Stripe's OpenAPI spec (`internal/generated`). A body
 * that does not decode fails with {@link PaymentProviderError}; the resource
 * modules migrated off the `stripe` package's types are all one call to this.
 */
export const stripeRequestDecoded = <S extends Schema.Codec<unknown, unknown>>(
  what: string,
  schema: S,
  method: StripeMethod,
  requestPath: RequestPath,
  params?: StripeParams | undefined,
): Effect.Effect<S["Type"], StripeError, StripeHttp> =>
  stripeRequest<unknown>(method, requestPath, params).pipe(
    Effect.flatMap((body) =>
      Schema.decodeUnknownEffect(schema)(body).pipe(
        Effect.mapError((cause): StripeError => malformed(what, cause)),
      ),
    ),
  );
