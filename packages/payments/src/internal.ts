/**
 * Helpers shared by the provider packages (`effect-payments-paypal`,
 * `effect-payments-airwallex`, and any later OAuth-style provider).
 *
 * **Internal, and exempt from semver.** This subpath exists only so the
 * providers in this repository can share code, since a provider may import
 * nothing but this package. It is not part of the public API: its exports can
 * change or disappear in any release, minor and patch included. Do not import
 * it from application code.
 *
 * It holds two vendor-neutral pieces:
 *
 * - {@link shareLogin}: one in-flight token login shared by every caller that
 *   needs a token while it runs.
 * - The integer money core: {@link exponentFrom}, {@link scaleToMinor}, {@link parseDecimal},
 *   {@link decimalText}, {@link formatDecimal} and {@link checkMinorUnits}.
 *   Everything is parameterised by a fraction-digit count, so the per-currency
 *   exponent tables and the wire adapters stay in each provider.
 *
 * @module
 */

import { Deferred, Effect, Exit, Fiber, Option, Ref } from "effect";
import { PaymentInvalidRequestError } from "./PaymentsError.js";

/**
 * What a leader publishes: the login's exit, or `None` when the leader was
 * interrupted before the login settled.
 */
type Outcome<E> = Option.Option<Exit.Exit<string, E>>;

/** The in-flight login's published outcome. */
type Slot<E> = Deferred.Deferred<Outcome<E>>;

/**
 * One in-flight login, shared by every caller that needs a token while it runs.
 *
 * The first caller without a usable token becomes the *leader*: it installs a
 * `Deferred` in the in-flight slot and runs the login. Every caller that
 * arrives while the slot is occupied awaits that `Deferred` instead of logging
 * in itself, so it observes the same outcome — the same token, or the very
 * same error (a login timeout's `PaymentNetworkError`, a 401's
 * `PaymentAuthenticationError`, …) after roughly one login's duration rather
 * than one login per queued caller. When the login settles the slot is
 * cleared *before* its outcome is published, so a caller that arrives after a
 * failure starts a fresh attempt; nothing is cached on failure.
 *
 * If the leader itself is interrupted (its caller gave up), the login it was
 * running is interrupted with it and the slot is cleared; the callers that
 * were waiting on it are told the login was abandoned and try again, so one of
 * them becomes the next leader. Nobody is left waiting on a login no one runs.
 * A login that fails on its own — whatever its cause — is shared, never
 * retried by the callers that waited on it.
 *
 * Builds a `getToken` effect from `cached` (the stored token, if still usable)
 * and `login` (which fetches and stores a new one).
 *
 * Internal, and exempt from semver: see the module documentation.
 */
export const shareLogin = <E>(
  cached: Effect.Effect<Option.Option<string>>,
  login: Effect.Effect<string, E>,
): Effect.Effect<Effect.Effect<string, E>> =>
  Effect.map(Ref.make(Option.none<Slot<E>>()), (inFlight) => {
    const loginUnlessCached: Effect.Effect<string, E> = Effect.flatMap(
      cached,
      Option.match({ onNone: () => login, onSome: Effect.succeed }),
    );

    /**
     * Run the login as the leader and publish its outcome through `slot`.
     *
     * The login runs in a child fiber, so its exit — whatever its cause, even
     * one containing an interruption of its own — arrives here as a *value*.
     * The only way awaiting it can fail is this leader being interrupted: that
     * alone is published as "abandoned" (after interrupting the login, which
     * aborts its fetch), so waiters retry only when no one is left to finish
     * the login, never after a login that failed on its own.
     *
     * The leader re-checks the cache: a previous leader may have stored a
     * token between this caller's first check and its taking the slot.
     */
    const lead = (slot: Slot<E>, restore: Restore): Effect.Effect<string, E> =>
      Effect.gen(function* () {
        const running = yield* Effect.forkChild(loginUnlessCached, { startImmediately: true });
        const exit = yield* restore(Fiber.await(running)).pipe(
          Effect.onInterrupt(() => Fiber.interrupt(running)),
          // Clear the slot BEFORE publishing, so a caller that arrives after
          // the outcome (even one resumed synchronously by the publish) never
          // joins a settled login: it sees the token, or logs in afresh.
          Effect.onExit((awaited) =>
            Ref.set(inFlight, Option.none()).pipe(
              Effect.andThen(
                Deferred.succeed(
                  slot,
                  Exit.isSuccess(awaited) ? Option.some(awaited.value) : Option.none(),
                ),
              ),
            ),
          ),
        );
        return yield* exit;
      });

    /** Take the slot for `fresh`, or return the login already in it. */
    const join = (fresh: Slot<E>): Effect.Effect<Option.Option<Slot<E>>> =>
      Ref.modify(inFlight, (current): readonly [Option.Option<Slot<E>>, Option.Option<Slot<E>>] =>
        Option.isSome(current) ? [current, current] : [Option.none(), Option.some(fresh)],
      );

    const getToken: Effect.Effect<string, E> = Effect.gen(function* () {
      const token = yield* cached;
      if (Option.isSome(token)) return token.value;
      const fresh = yield* Deferred.make<Outcome<E>>();
      // Taking the slot and attaching its release happen without an
      // interruption point between them, so a slot is never orphaned.
      return yield* Effect.uninterruptibleMask((restore) =>
        Effect.gen(function* () {
          const running = yield* join(fresh);
          if (Option.isNone(running)) return yield* lead(fresh, restore);
          const outcome = yield* restore(Deferred.await(running.value));
          // `None`: the leader gave up, so try again (as leader or waiter).
          return yield* Option.isSome(outcome) ? outcome.value : restore(getToken);
        }),
      );
    });
    return getToken;
  });

/** The `restore` an `Effect.uninterruptibleMask` body receives. */
type Restore = <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;

/**
 * Build a provider's `exponent(currency)` from its own currency tables: the
 * codes (lower case) with no minor unit, and those with three fraction digits.
 * Every other currency has two. The lookup is case-insensitive. The tables are
 * the provider's, since they follow each vendor's own currency reference.
 *
 * Internal, and exempt from semver: see the module documentation.
 */
export const exponentFrom =
  (zeroDecimal: ReadonlySet<string>, threeDecimal: ReadonlySet<string>) =>
  (currency: string): 0 | 2 | 3 => {
    const code = currency.toLowerCase();
    if (zeroDecimal.has(code)) return 0;
    if (threeDecimal.has(code)) return 3;
    return 2;
  };

/** The largest minor-unit magnitude a neutral amount may have. */
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Scale the decimal `mantissa × 10^-scale` to minor units for a currency with
 * `digits` fraction digits, using integer (`BigInt`) arithmetic only. Returns
 * the magnitude, or `undefined` when the value has more fraction digits than
 * the currency allows (`scale > digits`, so nothing is rounded) or exceeds the
 * safe-integer range as minor units.
 *
 * Internal, and exempt from semver: see the module documentation.
 */
export const scaleToMinor = (
  mantissa: bigint,
  scale: number,
  digits: number,
): bigint | undefined => {
  if (scale > digits) return undefined;
  const magnitude = mantissa * 10n ** BigInt(digits - scale);
  return magnitude > MAX_SAFE ? undefined : magnitude;
};

/** An optionally negative decimal: whole digits and an optional fraction. */
const DECIMAL = /^(-?)(\d+)(?:\.(\d+))?$/;

/**
 * Parse a major-unit decimal string into minor units for a currency with
 * `digits` fraction digits, or `undefined` when it is malformed, has more
 * fraction digits than `digits`, or is outside the safe-integer range as minor
 * units. Never produces `-0`.
 *
 * Internal, and exempt from semver: see the module documentation.
 */
export const parseDecimal = (text: string, digits: number): number | undefined => {
  const match = DECIMAL.exec(text);
  if (match === null) return undefined;
  const [, sign, whole, fraction = ""] = match;
  const magnitude = scaleToMinor(BigInt(`${whole}${fraction}`), fraction.length, digits);
  if (magnitude === undefined) return undefined;
  // `magnitude` is 0 for "-0.00"; never produce -0.
  return sign === "-" && magnitude !== 0n ? -Number(magnitude) : Number(magnitude);
};

/**
 * The decimal text of `sign · magnitude × 10^-digits`, e.g. `-12.34`.
 *
 * Internal, and exempt from semver: see the module documentation.
 */
export const decimalText = (negative: boolean, magnitude: bigint, digits: number): string => {
  const text = magnitude.toString().padStart(digits + 1, "0");
  const point = text.length - digits;
  const body = digits === 0 ? text : `${text.slice(0, point)}.${text.slice(point)}`;
  return negative ? `-${body}` : body;
};

/**
 * Format minor units as a major-unit decimal string with `digits` fraction
 * digits, or `undefined` when `minor` is not a safe integer (such an amount has
 * no exact decimal form, and sending a rounded one would charge a different
 * amount).
 *
 * Internal, and exempt from semver: see the module documentation.
 */
export const formatDecimal = (minor: number, digits: number): string | undefined =>
  Number.isSafeInteger(minor) ? decimalText(minor < 0, BigInt(Math.abs(minor)), digits) : undefined;

/**
 * Check a request amount without needing its currency, failing with
 * {@link PaymentInvalidRequestError} (naming `param`) unless it is a
 * non-negative safe integer (a price, an order or a refund amount is never
 * below zero). Callers run it before sending anything.
 *
 * Internal, and exempt from semver: see the module documentation.
 */
export const checkMinorUnits = (
  minor: number,
  param: string,
): Effect.Effect<void, PaymentInvalidRequestError> =>
  Number.isSafeInteger(minor) && minor >= 0
    ? Effect.void
    : Effect.fail(
        new PaymentInvalidRequestError({
          message: `\`${param}\` must be a non-negative whole number of minor units within the safe-integer range`,
          param,
        }),
      );
