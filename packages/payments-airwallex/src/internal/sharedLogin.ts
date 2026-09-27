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
 * @module
 */

import { Deferred, Effect, Exit, Fiber, Option, Ref } from "effect";

/**
 * What a leader publishes: the login's exit, or `None` when the leader was
 * interrupted before the login settled.
 */
type Outcome<E> = Option.Option<Exit.Exit<string, E>>;

/** The in-flight login's published outcome. */
type Slot<E> = Deferred.Deferred<Outcome<E>>;

/**
 * Build a `getToken` effect from `cached` (the stored token, if still usable)
 * and `login` (which fetches and stores a new one).
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
