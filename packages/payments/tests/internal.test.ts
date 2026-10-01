import { describe, it, expect } from "vite-plus/test";
import { Cause, Deferred, Effect, Exit, Fiber, Option, Ref, Schema } from "effect";
import { PaymentInvalidRequestError } from "../src/PaymentsError.ts";
import {
  checkMinorUnits,
  decimalText,
  exponentFrom,
  formatDecimal,
  parseDecimal,
  scaleToMinor,
  shareLogin,
} from "../src/internal.ts";

class LoginFailed extends Schema.TaggedError<LoginFailed>()("LoginFailed", {
  attempt: Schema.Number,
}) {}

const ok = (token: string) => () => Exit.succeed(token);
const refused = (attempt: number) => Exit.fail(new LoginFailed({ attempt }));

/**
 * A controllable token source for `shareLogin`: a cache `Ref` the `cached`
 * effect reads (optionally pausing a read on a gate), and a login whose every
 * attempt is counted, waits for `gate`, then runs the scripted outcome for
 * that attempt. A successful outcome stores its token, as the real clients do.
 */
const harness = (outcomes: ReadonlyArray<(attempt: number) => Exit.Exit<string, LoginFailed>>) =>
  Effect.gen(function* () {
    const cache = yield* Ref.make(Option.none<string>());
    const logins = yield* Ref.make(0);
    const gate = yield* Deferred.make<void>();
    const readGate = yield* Ref.make(Option.none<Deferred.Deferred<void>>());

    const cached = Effect.gen(function* () {
      const value = yield* Ref.get(cache);
      // Take the pause (if armed) once: the next read blocks until released.
      const pause = yield* Ref.getAndSet(readGate, Option.none());
      if (Option.isSome(pause)) yield* Deferred.await(pause.value);
      return value;
    });

    const login = Effect.gen(function* () {
      const attempt = yield* Ref.updateAndGet(logins, (n) => n + 1);
      yield* Deferred.await(gate);
      const script = outcomes[Math.min(attempt, outcomes.length) - 1] ?? refused;
      const outcome = script(attempt);
      if (Exit.isSuccess(outcome)) yield* Ref.set(cache, Option.some(outcome.value));
      return yield* outcome;
    });

    const getToken = yield* shareLogin(cached, login);
    return { getToken, logins, gate, readGate, cache };
  });

const fork = <A, E>(effect: Effect.Effect<A, E>) =>
  Effect.forkChild(effect, { startImmediately: true });

/** Let every runnable fiber reach its next suspension point. */
const settle = Effect.gen(function* () {
  for (let i = 0; i < 10; i++) yield* Effect.yieldNow;
});

describe("shareLogin", () => {
  it("a caller arriving right after a failure never joins the settled login", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const { getToken, logins, gate } = yield* harness([refused, ok("tok_2")]);
        const leader = yield* fork(Effect.flip(getToken));
        // A waiter that calls again the moment it sees the failure: it is
        // resumed synchronously by the publish, so if the slot were cleared
        // only afterwards, its second call would join the settled login and
        // replay the stale error instead of logging in afresh.
        const waiter = yield* fork(
          Effect.flip(getToken).pipe(
            Effect.flatMap((first) =>
              Effect.map(Effect.exit(getToken), (second) => ({ first, second })),
            ),
          ),
        );
        yield* settle;
        yield* Deferred.succeed(gate, undefined);
        return {
          leader: yield* Fiber.join(leader),
          waiter: yield* Fiber.join(waiter),
          logins: yield* Ref.get(logins),
        };
      }),
    );

    expect(result.leader).toEqual(new LoginFailed({ attempt: 1 }));
    expect(result.waiter.first).toBe(result.leader);
    expect(result.waiter.second).toEqual(Exit.succeed("tok_2"));
    expect(result.logins).toBe(2);
  });

  it("a leader re-checks the cache, so a caller that took the slot after a success does not log in again", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const { getToken, logins, gate, readGate } = yield* harness([ok("tok_1")]);
        const leader = yield* fork(getToken);
        yield* settle;
        // The late caller misses the cache, then pauses before taking the slot.
        const pause = yield* Deferred.make<void>();
        yield* Ref.set(readGate, Option.some(pause));
        const late = yield* fork(getToken);
        yield* settle;
        // The first login succeeds, stores its token and frees the slot…
        yield* Deferred.succeed(gate, undefined);
        const first = yield* Fiber.join(leader);
        // …and only then does the late caller take the (now empty) slot.
        yield* Deferred.succeed(pause, undefined);
        return { first, late: yield* Fiber.join(late), logins: yield* Ref.get(logins) };
      }),
    );

    expect(result.first).toBe("tok_1");
    expect(result.late).toBe("tok_1");
    expect(result.logins).toBe(1);
  });

  it("shares a login failure whose cause contains an interruption; waiters do not re-login", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const { getToken, logins, gate } = yield* harness([
          // The login fails on its own, with an interrupt in its cause (e.g.
          // a child it ran was interrupted); the leader is not interrupted.
          (attempt) =>
            Exit.failCause(
              Cause.combine(Cause.fail(new LoginFailed({ attempt })), Cause.interrupt()),
            ),
        ]);
        const fibers = yield* Effect.forEach(
          Array.from({ length: 4 }),
          () => fork(Effect.exit(getToken)),
          { concurrency: 1 },
        );
        yield* settle;
        yield* Deferred.succeed(gate, undefined);
        const exits = yield* Effect.forEach(fibers, Fiber.join, { concurrency: 1 });
        return { exits, logins: yield* Ref.get(logins) };
      }),
    );

    expect(result.logins).toBe(1);
    for (const exit of result.exits) {
      expect(Exit.findErrorOption(exit)).toEqual(Option.some(new LoginFailed({ attempt: 1 })));
    }
  });

  it("interrupting the leader interrupts its login and lets a waiter take over", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const { getToken, logins, gate } = yield* harness([ok("tok_1")]);
        const leader = yield* fork(getToken);
        yield* settle;
        const waiter = yield* fork(getToken);
        yield* settle;
        yield* Fiber.interrupt(leader);
        yield* settle;
        yield* Deferred.succeed(gate, undefined);
        return {
          leader: yield* Fiber.await(leader),
          waiter: yield* Fiber.join(waiter),
          logins: yield* Ref.get(logins),
        };
      }),
    );

    expect(Exit.hasInterrupts(result.leader)).toBe(true);
    expect(result.waiter).toBe("tok_1");
    // The abandoned attempt and the waiter's own.
    expect(result.logins).toBe(2);
  });
});

describe("scaleToMinor", () => {
  it("scales a mantissa to minor units with integer arithmetic", () => {
    expect(scaleToMinor(1234n, 2, 2)).toBe(1234n);
    expect(scaleToMinor(12n, 0, 2)).toBe(1200n);
    expect(scaleToMinor(5n, 1, 3)).toBe(500n);
    expect(scaleToMinor(7n, 0, 0)).toBe(7n);
    expect(scaleToMinor(0n, 5, 5)).toBe(0n);
  });

  it("refuses more fraction digits than the currency allows rather than rounding", () => {
    expect(scaleToMinor(1001n, 3, 2)).toBeUndefined();
    expect(scaleToMinor(1n, 1, 0)).toBeUndefined();
  });

  it("refuses a magnitude beyond the safe-integer range, and allows the limit itself", () => {
    expect(scaleToMinor(BigInt(Number.MAX_SAFE_INTEGER), 0, 0)).toBe(
      BigInt(Number.MAX_SAFE_INTEGER),
    );
    expect(scaleToMinor(BigInt(Number.MAX_SAFE_INTEGER) + 1n, 0, 0)).toBeUndefined();
    expect(scaleToMinor(BigInt(Number.MAX_SAFE_INTEGER), 0, 2)).toBeUndefined();
  });
});

describe("parseDecimal", () => {
  it("parses a decimal string for the given number of fraction digits", () => {
    expect(parseDecimal("10.00", 2)).toBe(1000);
    expect(parseDecimal("10", 2)).toBe(1000);
    expect(parseDecimal("0.5", 2)).toBe(50);
    expect(parseDecimal("1.234", 3)).toBe(1234);
    expect(parseDecimal("1500", 0)).toBe(1500);
    expect(parseDecimal("-12.34", 2)).toBe(-1234);
  });

  it("never produces -0", () => {
    expect(Object.is(parseDecimal("-0.00", 2), 0)).toBe(true);
    expect(Object.is(parseDecimal("-0", 0), 0)).toBe(true);
  });

  it("rejects malformed text, excess fraction digits and unsafe magnitudes", () => {
    for (const text of ["", "abc", "1.", ".5", "+1", "1e3", " 1", "1.2.3", "--1"]) {
      expect(parseDecimal(text, 2)).toBeUndefined();
    }
    expect(parseDecimal("1.001", 2)).toBeUndefined();
    expect(parseDecimal("1.5", 0)).toBeUndefined();
    expect(parseDecimal("90071992547409.92", 2)).toBeUndefined();
    expect(parseDecimal("90071992547409.91", 2)).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("decimalText and formatDecimal", () => {
  it("places the decimal point and pads small magnitudes", () => {
    expect(decimalText(false, 1234n, 2)).toBe("12.34");
    expect(decimalText(true, 1234n, 2)).toBe("-12.34");
    expect(decimalText(false, 5n, 2)).toBe("0.05");
    expect(decimalText(false, 0n, 3)).toBe("0.000");
    expect(decimalText(true, 7n, 0)).toBe("-7");
  });

  it("formats safe-integer minor units and refuses anything else", () => {
    expect(formatDecimal(1000, 2)).toBe("10.00");
    expect(formatDecimal(-5, 2)).toBe("-0.05");
    expect(formatDecimal(0, 0)).toBe("0");
    expect(formatDecimal(1234, 3)).toBe("1.234");
    expect(formatDecimal(Number.MAX_SAFE_INTEGER, 2)).toBe("90071992547409.91");
    for (const minor of [10.5, 2 ** 53, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(formatDecimal(minor, 2)).toBeUndefined();
    }
  });

  it("round-trips through parseDecimal", () => {
    for (const digits of [0, 2, 3]) {
      for (const minor of [0, 1, 99, 100, 123456789, -1, -250, Number.MAX_SAFE_INTEGER]) {
        const text = formatDecimal(minor, digits);
        expect(text).toBeDefined();
        expect(parseDecimal(text as string, digits)).toBe(minor);
      }
    }
  });
});

describe("checkMinorUnits", () => {
  it("needs no currency and refuses a negative or non-safe-integer amount", async () => {
    await Effect.runPromise(checkMinorUnits(0, "amount"));
    await Effect.runPromise(checkMinorUnits(Number.MAX_SAFE_INTEGER, "amount"));
    for (const minor of [-1, 10.5, 2 ** 53, Number.NaN]) {
      const error = await Effect.runPromise(Effect.flip(checkMinorUnits(minor, "amount")));
      expect(error).toBeInstanceOf(PaymentInvalidRequestError);
      expect(error.param).toBe("amount");
    }
  });
});

describe("exponentFrom", () => {
  const exponent = exponentFrom(new Set(["jpy"]), new Set(["kwd"]));

  it("looks a currency up in the given tables, case-insensitively, defaulting to two", () => {
    expect(exponent("jpy")).toBe(0);
    expect(exponent("JPY")).toBe(0);
    expect(exponent("KWD")).toBe(3);
    expect(exponent("usd")).toBe(2);
    expect(exponent("")).toBe(2);
  });
});
