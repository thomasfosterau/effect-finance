/**
 * The `@thomasfosterau/effect-payments/internal` subpath resolves against the
 * EMITTED declarations, and its helpers keep the shapes the providers rely on.
 * The subpath is internal and exempt from semver; this fixture is the provider
 * contract, not a consumer-facing promise. Never executed; type-checked only.
 */

import type { Effect, Option } from "effect";
import type { PaymentInvalidRequestError } from "@thomasfosterau/effect-payments";
import {
  checkMinorUnits,
  decimalText,
  exponentFrom,
  formatDecimal,
  parseDecimal,
  scaleToMinor,
  shareLogin,
} from "@thomasfosterau/effect-payments/internal";

declare const cached: Effect.Effect<Option.Option<string>>;
declare const login: Effect.Effect<string, "denied">;

/** `shareLogin` yields a `getToken` carrying the login's own error type. */
export const getToken: Effect.Effect<Effect.Effect<string, "denied">> = shareLogin(cached, login);

/** The money core's declared shapes. */
export const parsed: number | undefined = parseDecimal("10.00", 2);
export const formatted: string | undefined = formatDecimal(1000, 2);
export const text: string = decimalText(false, 1000n, 2);
export const scaled: bigint | undefined = scaleToMinor(1000n, 2, 2);
export const checked: Effect.Effect<void, PaymentInvalidRequestError> = checkMinorUnits(
  1,
  "amount",
);
export const exponent: (currency: string) => 0 | 2 | 3 = exponentFrom(
  new Set(["jpy"]),
  new Set(["kwd"]),
);
