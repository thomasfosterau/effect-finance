import { describe, expect, it } from "vite-plus/test";
import { Effect, Exit, Schema } from "effect";
import { PaymentProviderError } from "@thomasfosterau/effect-payments";
import * as SubscriptionSchedule from "../src/SubscriptionSchedule.ts";
import type { StripeHttp } from "../src/StripeHttp.ts";
import { fakeStripeHttp } from "./support.ts";
import schedule from "./fixtures/basil/subscription-schedule.json" with { type: "json" };

const run = <A>(effect: Effect.Effect<A, unknown, StripeHttp>, respond: () => unknown) => {
  const http = fakeStripeHttp(respond);
  return { http, exit: Effect.runPromiseExit(Effect.provide(effect, http.layer)) };
};

/** The failures of an exit that must have failed, as values the test can inspect. */
const failuresOf = (exit: Exit.Exit<unknown, unknown>): ReadonlyArray<unknown> =>
  Exit.isFailure(exit)
    ? exit.cause.reasons.map((reason) => ("error" in reason ? reason.error : reason))
    : [];

/** One operation of the module: its name, a call, what it decodes and a malformed answer. */
type Operation = readonly [
  name: string,
  call: () => Effect.Effect<unknown, unknown, StripeHttp>,
  what: string,
  body: unknown,
];

const page = (data: ReadonlyArray<unknown>) => ({
  object: "list",
  url: "/v1/subscription_schedules",
  has_more: false,
  data,
});

/** A schedule without its required `phases`: well-formed JSON, wrong shape. */
const malformed = Object.fromEntries(Object.entries(schedule).filter(([key]) => key !== "phases"));

describe("SubscriptionSchedule (generated basil types)", () => {
  it("decodes a real-shaped 2025-08-27.basil subscription schedule", async () => {
    const { http, exit } = run(
      SubscriptionSchedule.create({ from_subscription: "sub_1SABcDEfGhIjKlMnOpQrStUv" }),
      () => schedule,
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.id).toBe("sub_sched_1SABcDEfGhIjKlMnOpQrStUv");
    expect(result.value.status).toBe("active");
    expect(result.value.end_behavior).toBe("release");
    expect(result.value.current_phase?.end_date).toBe(1761868400);
    expect(result.value.phases[0]?.items[0]?.price).toBe("price_1SABcDEfGhIjKlMnOpQrStUv");
    expect(http.calls[0]).toMatchObject({
      method: "POST",
      path: "/v1/subscription_schedules",
      params: { from_subscription: "sub_1SABcDEfGhIjKlMnOpQrStUv" },
    });
  });

  it.each<Operation>([
    ["create", () => SubscriptionSchedule.create(), "subscription schedule", malformed],
    [
      "retrieve",
      () => SubscriptionSchedule.retrieve("sub_sched_1"),
      "subscription schedule",
      malformed,
    ],
    [
      "update",
      () => SubscriptionSchedule.update("sub_sched_1", { end_behavior: "cancel" }),
      "subscription schedule",
      malformed,
    ],
    [
      "cancel",
      () => SubscriptionSchedule.cancel("sub_sched_1"),
      "subscription schedule",
      malformed,
    ],
    [
      "release",
      () => SubscriptionSchedule.release("sub_sched_1"),
      "subscription schedule",
      malformed,
    ],
    ["list", () => SubscriptionSchedule.list(), "subscription schedule list", page([malformed])],
  ])(
    "%s fails with PaymentProviderError on a malformed 2xx body",
    async (_name, operation, what, body) => {
      const [failure] = failuresOf(await run(operation(), () => body).exit);
      expect(failure).toBeInstanceOf(PaymentProviderError);
      expect(failure).toMatchObject({
        provider: "stripe",
        message: `Stripe returned a malformed ${what} response`,
      });
    },
  );

  it("fails with PaymentProviderError on each kind of malformed body", async () => {
    const cases = {
      "a missing required field": malformed,
      "a wrongly typed field": { ...schedule, livemode: "no" },
      "a non-object body": "<html>bad gateway</html>",
    };
    for (const [label, body] of Object.entries(cases)) {
      const [failure] = failuresOf(
        await run(SubscriptionSchedule.retrieve("sub_sched_1"), () => body).exit,
      );
      expect(failure, label).toBeInstanceOf(PaymentProviderError);
    }
  });

  it("decodes an expanded field as an open object and a later enumeration value as Other", async () => {
    const { exit } = run(
      SubscriptionSchedule.retrieve("sub_sched_1", { expand: ["subscription"] }),
      () => ({
        ...schedule,
        subscription: { id: "sub_1", object: "subscription" },
        end_behavior: "extend",
      }),
    );
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.subscription).toMatchObject({ id: "sub_1" });
    expect(result.value.end_behavior).toEqual({ _tag: "Other", raw: "extend" });
    expect(result.value.status).toBe("active");
  });

  it("cancels and releases at their action paths, by encoded id", async () => {
    const canceled = run(
      SubscriptionSchedule.cancel("sub_sched_a/b", { invoice_now: true }),
      () => ({ ...schedule, status: "canceled", canceled_at: 1759200000 }),
    );
    expect(Exit.isSuccess(await canceled.exit)).toBe(true);
    expect(canceled.http.calls[0]).toMatchObject({
      method: "POST",
      path: "/v1/subscription_schedules/sub_sched_a%2Fb/cancel",
      params: { invoice_now: true },
    });

    const released = run(
      SubscriptionSchedule.release("sub_sched_1", { preserve_cancel_date: true }),
      () => ({ ...schedule, status: "released", released_subscription: "sub_1" }),
    );
    const result = await released.exit;
    expect(Exit.isSuccess(result) && result.value.released_subscription).toBe("sub_1");
    expect(released.http.calls[0]).toMatchObject({
      method: "POST",
      path: "/v1/subscription_schedules/sub_sched_1/release",
    });
  });

  it("decodes a list page", async () => {
    const list = run(
      SubscriptionSchedule.list({ customer: "cus_QxAbCdEfGhIjKl", released_at: { gte: 1 } }),
      () => page([schedule]),
    );
    const result = await list.exit;
    expect(Exit.isSuccess(result) && result.value.data[0]?.id).toBe(schedule.id);
    expect(list.http.calls[0]).toMatchObject({
      method: "GET",
      path: "/v1/subscription_schedules",
      params: { customer: "cus_QxAbCdEfGhIjKl" },
    });
  });

  it("exposes the generated schemas", () => {
    expect(
      Schema.decodeUnknownSync(SubscriptionSchedule.SubscriptionSchedule)(schedule).object,
    ).toBe("subscription_schedule");
    expect(
      Schema.decodeUnknownSync(SubscriptionSchedule.SubscriptionScheduleList)(page([])).data,
    ).toEqual([]);
  });
});
