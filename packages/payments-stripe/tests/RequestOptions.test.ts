import { describe, it, expect } from "vite-plus/test";
import { Effect, Redacted } from "effect";
// oxlint-disable-next-line effect/use-filesystem-service -- a test inspecting the package's own source files, outside any Effect runtime
import { readdirSync, readFileSync } from "node:fs";
import * as Customer from "../src/Customer.ts";
import * as BillingPortalSession from "../src/BillingPortal.Session.ts";
import * as CheckoutSession from "../src/CheckoutSession.ts";
import * as File from "../src/File.ts";
import * as Subscription from "../src/Subscription.ts";
import * as TerminalLocation from "../src/Terminal.Location.ts";
import * as TreasuryFinancialAccount from "../src/Treasury.FinancialAccount.ts";
import { PaymentInvalidRequestError } from "@thomasfosterau/effect-payments";
import { make, StripeHttp, type StripeRequest } from "../src/StripeHttp.ts";
import { fakeStripeHttp, jsonResponse, stubFetch, withTestClock } from "./support.ts";
import customer from "./fixtures/basil/customer.json" with { type: "json" };

/**
 * Per-call request options (#55): every resource-module operation takes a
 * trailing `{ idempotencyKey?, stripeAccount? }` and the transport sends them.
 */

const run = <A, E>(effect: Effect.Effect<A, E, never>) => Effect.runPromise(effect);

/** A well-formed answer to each `Customer` operation (the module decodes its responses). */
const customerAnswer = (request: StripeRequest): unknown =>
  request.method === "DELETE"
    ? { id: customer.id, object: "customer", deleted: true }
    : request.path === "/v1/customers" && request.method === "GET"
      ? { object: "list", url: "/v1/customers", has_more: false, data: [customer] }
      : customer;

describe("resource modules forward their options to the transport", () => {
  const options = { idempotencyKey: "key-1", stripeAccount: "acct_1" };

  it("on a create", async () => {
    const { layer, calls } = fakeStripeHttp(customerAnswer);
    await run(Customer.create({ email: "a@example.com" }, options).pipe(Effect.provide(layer)));
    expect(calls).toEqual([
      {
        method: "POST",
        path: "/v1/customers",
        params: { email: "a@example.com" },
        idempotencyKey: "key-1",
        stripeAccount: "acct_1",
      },
    ]);
  });

  it("on every verb, params or not", async () => {
    const { layer, calls } = fakeStripeHttp(customerAnswer);
    await run(
      Effect.gen(function* () {
        yield* Customer.retrieve("cus_1", undefined, options);
        yield* Customer.update("cus_1", { name: "N" }, options);
        yield* Customer.del("cus_1", options);
        yield* Customer.list({ limit: 1 }, options);
      }).pipe(Effect.provide(layer)),
    );
    expect(calls.map((call) => [call.method, call.path])).toEqual([
      ["GET", "/v1/customers/cus_1"],
      ["POST", "/v1/customers/cus_1"],
      ["DELETE", "/v1/customers/cus_1"],
      ["GET", "/v1/customers"],
    ]);
    for (const call of calls) {
      expect(call).toMatchObject({ idempotencyKey: "key-1", stripeAccount: "acct_1" });
    }
  });

  it("on an upload, a nested module and an action", async () => {
    const { layer, calls } = fakeStripeHttp();
    await run(
      Effect.gen(function* () {
        yield* File.create({ purpose: "dispute_evidence", file: { data: "x" } } as never, options);
        yield* TerminalLocation.create({ display_name: "HQ", address: {} } as never, options);
        yield* TreasuryFinancialAccount.create({ supported_currencies: ["usd"] }, options);
        yield* Subscription.cancel("sub_1", undefined, options);
      }).pipe(Effect.provide(layer)),
    );
    expect(calls).toHaveLength(4);
    expect(calls[0]).toMatchObject({ upload: true, idempotencyKey: "key-1" });
    for (const call of calls) {
      expect(call).toMatchObject({ idempotencyKey: "key-1", stripeAccount: "acct_1" });
    }
  });

  it("on a module that decodes its response (the generated-schema modules)", async () => {
    const { layer, calls } = fakeStripeHttp();
    await run(
      Effect.gen(function* () {
        // The empty answer fails the decode; the request was recorded before that.
        yield* Effect.exit(CheckoutSession.create({} as never, options));
        yield* Effect.exit(CheckoutSession.expire("cs_1", undefined, options));
        yield* Effect.exit(BillingPortalSession.create({ customer: "cus_1" }, options));
      }).pipe(Effect.provide(layer)),
    );
    expect(calls.map((call) => call.path)).toEqual([
      "/v1/checkout/sessions",
      "/v1/checkout/sessions/cs_1/expire",
      "/v1/billing_portal/sessions",
    ]);
    for (const call of calls) {
      expect(call).toMatchObject({ idempotencyKey: "key-1", stripeAccount: "acct_1" });
    }
  });

  it("with no options, sends neither field", async () => {
    const { layer, calls } = fakeStripeHttp(customerAnswer);
    await run(Customer.create({}).pipe(Effect.provide(layer)));
    expect(calls[0]?.idempotencyKey).toBeUndefined();
    expect(calls[0]?.stripeAccount).toBeUndefined();
  });

  it("passes on only the two documented fields", async () => {
    const { layer, calls } = fakeStripeHttp(customerAnswer);
    await run(
      Customer.create({}, {
        idempotencyKey: "k",
        method: "DELETE",
        path: "/v1/other",
      } as never).pipe(Effect.provide(layer)),
    );
    expect(calls[0]).toMatchObject({ method: "POST", path: "/v1/customers", idempotencyKey: "k" });
  });
});

describe("the options reach the wire", () => {
  it("sends the Idempotency-Key and Stripe-Account headers", async () => {
    const { http, calls } = stubFetch(() => jsonResponse(200, customer));
    await run(
      Effect.gen(function* () {
        const client = yield* make({ apiKey: Redacted.make("sk_test_not_a_real_key_4242") });
        return yield* Customer.create(
          { email: "a@example.com" },
          {
            idempotencyKey: "signup-1",
            stripeAccount: "acct_9",
          },
        ).pipe(Effect.provideService(StripeHttp, client));
      }).pipe(Effect.provide(http)),
    );
    expect(calls[0]?.headers.get("idempotency-key")).toBe("signup-1");
    expect(calls[0]?.headers.get("stripe-account")).toBe("acct_9");
  });

  it("sends the same key on a caller's retry after a timeout-like failure", async () => {
    const { http, calls } = stubFetch((_request, attempt) => {
      if (attempt === 1) throw new TypeError("network down");
      return jsonResponse(200, customer);
    });
    const write = (client: StripeHttp["Service"]) =>
      Customer.create({ email: "a@example.com" }, { idempotencyKey: "signup-2" }).pipe(
        Effect.provideService(StripeHttp, client),
      );
    await run(
      withTestClock(
        Effect.gen(function* () {
          // Transport retries off, so the first failure surfaces to the caller,
          // who retries the same logical write with the same key.
          const client = yield* make({
            apiKey: Redacted.make("sk_test_not_a_real_key_4242"),
            maxNetworkRetries: 0,
          });
          yield* write(client).pipe(Effect.flip);
          return yield* write(client);
        }).pipe(Effect.provide(http)),
      ),
    );
    expect(calls).toHaveLength(2);
    expect(calls.map((call) => call.headers.get("idempotency-key"))).toEqual([
      "signup-2",
      "signup-2",
    ]);
  });

  it("keeps a caller's key across the transport's own retries", async () => {
    const { http, calls } = stubFetch((_request, attempt) =>
      attempt === 1
        ? jsonResponse(500, { error: { type: "api_error", message: "boom" } })
        : jsonResponse(200, customer),
    );
    await run(
      withTestClock(
        Effect.gen(function* () {
          const client = yield* make({ apiKey: Redacted.make("sk_test_not_a_real_key_4242") });
          return yield* Customer.create({}, { idempotencyKey: "signup-3" }).pipe(
            Effect.provideService(StripeHttp, client),
          );
        }).pipe(Effect.provide(http)),
      ),
    );
    expect(calls.map((call) => call.headers.get("idempotency-key"))).toEqual([
      "signup-3",
      "signup-3",
    ]);
  });
});

describe("an empty option is refused, not silently dropped", () => {
  it.each(["idempotencyKey", "stripeAccount"] as const)(
    '%s: "" fails with PaymentInvalidRequestError before anything is sent',
    async (name) => {
      const { http, calls } = stubFetch(() => jsonResponse(200, customer));
      const error = await run(
        Effect.gen(function* () {
          const client = yield* make({ apiKey: Redacted.make("sk_test_not_a_real_key_4242") });
          return yield* Customer.create({}, { [name]: "" }).pipe(
            Effect.flip,
            Effect.provideService(StripeHttp, client),
          );
        }).pipe(Effect.provide(http)),
      );
      expect(error).toBeInstanceOf(PaymentInvalidRequestError);
      expect(error).toMatchObject({ param: name });
      expect(calls).toEqual([]);
    },
  );
});

describe("every resource-module operation takes options", () => {
  const SRC = new URL("../src/", import.meta.url);
  // oxlint-disable-next-line effect/avoid-sync-fs -- a test inspecting the package's own source files, outside any Effect runtime
  const modules = readdirSync(SRC).filter((name) => {
    if (!name.endsWith(".ts")) return false;
    // oxlint-disable-next-line effect/avoid-sync-fs -- a test inspecting the package's own source files, outside any Effect runtime
    const source = readFileSync(new URL(name, SRC), "utf8");
    return (
      /\bstripe(Request|RequestDecoded|Upload)\(/.test(source) &&
      source.includes("./internal/index.js")
    );
  });

  it("finds the resource modules", () => {
    expect(modules.length).toBeGreaterThan(40);
  });

  it.each(modules)("%s declares and forwards options on each operation", (name) => {
    // oxlint-disable-next-line effect/avoid-sync-fs -- a test inspecting the package's own source files, outside any Effect runtime
    const source = readFileSync(new URL(name, SRC), "utf8");
    const operations = [...source.matchAll(/^export const \w+ = \(/gm)].length;
    const declared = [...source.matchAll(/options\?: RequestOptions \| undefined,?\n?\)/g)].length;
    const calls = [...source.matchAll(/\bstripe(?:Request|RequestDecoded|Upload)\(([^;]*?)\);/gs)];
    expect(declared).toBe(operations);
    expect(calls).toHaveLength(operations);
    for (const [call] of calls) expect(call).toMatch(/\boptions,?\s*\);$/);
  });
});
