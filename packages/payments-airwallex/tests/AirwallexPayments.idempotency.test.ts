import { describe, it, expect } from "vite-plus/test";
import { Effect, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as PaymentIntent from "@thomasfosterau/effect-payments/PaymentIntent";
import * as Refund from "@thomasfosterau/effect-payments/Refund";
import * as IdempotencyKey from "@thomasfosterau/effect-payments/IdempotencyKey";
import { PaymentInvalidRequestError, PaymentNetworkError } from "@thomasfosterau/effect-payments";
import { AirwallexClient, type AirwallexRequest } from "../src/Airwallex.ts";
import * as AirwallexPayments from "../src/AirwallexPayments.ts";

/**
 * The neutral `idempotencyKey` (#55, closing #66) on the create and confirm
 * operations: mapped onto Airwallex's `request_id`, and a retried write after a
 * lost response is one logical write.
 */

const KEY = IdempotencyKey.IdempotencyKey.make("write-0001");

type Capabilities = Layer.Success<typeof AirwallexPayments.capabilities>;

/** Run `operation` over a fake client answering `{}` (the decode fails; the request was recorded first). */
const requestsOf = async (operation: Effect.Effect<unknown, unknown, Capabilities>) => {
  const calls: Array<AirwallexRequest> = [];
  const client = AirwallexClient.of({
    request: (request) => Effect.sync(() => (calls.push(request), {})),
  });
  const exit = await Effect.runPromise(
    Effect.exit(
      operation.pipe(
        Effect.provide(
          Layer.provide(AirwallexPayments.capabilities, Layer.succeed(AirwallexClient, client)),
        ),
      ),
    ),
  );
  return { calls, exit };
};

const operations = (idempotencyKey: IdempotencyKey.IdempotencyKey | undefined) =>
  [
    [
      "Customer.create",
      "/api/v1/pa/customers",
      Customer.create({ email: "a@b.com", idempotencyKey }),
    ],
    [
      "PaymentIntent.create",
      "/api/v1/pa/payment_intents",
      PaymentIntent.create({ amount: 100, currency: "usd", idempotencyKey }),
    ],
    [
      "PaymentIntent.confirm",
      "/api/v1/pa/payment_intents/int_1/confirm",
      PaymentIntent.confirm("int_1", { idempotencyKey }),
    ],
    [
      "Refund.create",
      "/api/v1/pa/refunds",
      Refund.create({ paymentIntent: "int_1", idempotencyKey }),
    ],
  ] as const;

describe("Airwallex maps the neutral idempotencyKey to request_id", () => {
  it.each(operations(KEY).map(([name]) => name))("%s", async (name) => {
    const [, path, op] = operations(KEY).find(([candidate]) => candidate === name)!;
    const { calls } = await requestsOf(op);
    expect(calls.map((call) => [call.method, call.path, call.requestId])).toEqual([
      ["POST", path, KEY],
    ]);
  });

  it.each(operations(undefined).map(([name]) => name))(
    "%s keeps its fresh per-call request_id without a key",
    async (name) => {
      const [, , op] = operations(undefined).find(([candidate]) => candidate === name)!;
      const { calls } = await requestsOf(op);
      expect(calls.map((call) => call.requestId)).toEqual([undefined]);
      const body = calls[0]?.body as { request_id: string } | undefined;
      expect(body?.request_id).toMatch(/^[0-9a-f-]{36}$/);
    },
  );

  it.each(operations(undefined).map(([name]) => name))(
    "%s refuses a raw string before sending anything",
    async (name) => {
      // Untyped code can still pass a string the brand would have refused.
      const bad = "not a valid key" as IdempotencyKey.IdempotencyKey;
      const [, , op] = operations(bad).find(([candidate]) => candidate === name)!;
      const { calls, exit } = await requestsOf(op);
      expect(calls).toEqual([]);
      expect(exit._tag).toBe("Failure");
      expect(JSON.stringify(exit)).toContain("PaymentInvalidRequestError");
    },
  );

  it("sends the key on the refund POST only, not on the currency lookup of a partial refund", async () => {
    const calls: Array<AirwallexRequest> = [];
    const client = AirwallexClient.of({
      request: (request) =>
        Effect.sync(() => {
          calls.push(request);
          return request.method === "GET"
            ? { id: "int_1", amount: 10, currency: "USD", status: "SUCCEEDED" }
            : { id: "ref_1", amount: 1, currency: "USD", status: "SUCCEEDED" };
        }),
    });
    await Effect.runPromise(
      Refund.create({ paymentIntent: "int_1", amount: 100, idempotencyKey: KEY }).pipe(
        Effect.provide(
          Layer.provide(AirwallexPayments.capabilities, Layer.succeed(AirwallexClient, client)),
        ),
      ),
    );
    expect(calls.map((call) => [call.method, call.requestId])).toEqual([
      ["GET", undefined],
      ["POST", KEY],
    ]);
  });

  it("the cancel operation takes no key and keeps a fresh request_id", async () => {
    const { calls } = await requestsOf(PaymentIntent.cancel("int_1"));
    expect(calls.map((call) => call.requestId)).toEqual([undefined]);
  });
});

describe("a retried write after a lost response is one logical write (#66)", () => {
  const LOGIN_PATH = "/api/v1/authentication/login";

  /**
   * A fake Airwallex behind the real client: it dedupes `POST /customers` by the
   * body's `request_id` (the first request with an id applies the write, a repeat
   * returns the remembered customer). `loseFirstResponse` drops the answer to the
   * first write, as a timeout would: the customer exists, the caller never saw it.
   */
  const dedupingAirwallex = (loseFirstResponse: boolean) => {
    const seen = new Map<string, string>();
    const sent: Array<string> = [];
    let writes = 0;
    let attempts = 0;
    const fetchImpl: typeof globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.endsWith(LOGIN_PATH)) {
        return Response.json(
          { token: "tok_1", expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
          { status: 201 },
        );
      }
      attempts += 1;
      const raw = init?.body;
      const text = raw instanceof Uint8Array ? new TextDecoder().decode(raw) : String(raw);
      const requestId = (JSON.parse(text) as { request_id: string }).request_id;
      sent.push(requestId);
      const customerId = seen.get(requestId) ?? `cus_${(writes += 1)}`;
      seen.set(requestId, customerId);
      if (loseFirstResponse && attempts === 1) throw new TypeError("fetch failed");
      return Response.json({
        id: customerId,
        email: "a@b.com",
        created_at: "2026-01-01T00:00:00Z",
      });
    };
    const http = FetchHttpClient.layer.pipe(
      Layer.provide(Layer.succeed(FetchHttpClient.Fetch, fetchImpl)),
    );
    return { http, sent, writes: () => writes };
  };

  const config = { clientId: "client_1", apiKey: Redacted.make("key_1") };

  const createWithRetry = (idempotencyKey: IdempotencyKey.IdempotencyKey | undefined) =>
    Customer.create({ email: "a@b.com", idempotencyKey }).pipe(
      Effect.retry({ while: (error) => error._tag === "PaymentNetworkError", times: 1 }),
    );

  it("with one key reused on the retry, Airwallex applies it once", async () => {
    const fake = dedupingAirwallex(true);
    const customer = await Effect.runPromise(
      Effect.gen(function* () {
        const key = yield* IdempotencyKey.generate; // once per logical write
        return yield* createWithRetry(key);
      }).pipe(Effect.provide(AirwallexPayments.layer(config)), Effect.provide(fake.http)),
    );
    expect(customer.id).toBe("cus_1");
    expect(fake.writes()).toBe(1);
    expect(fake.sent).toHaveLength(2);
    expect(fake.sent[1]).toBe(fake.sent[0]);
  });

  it("without a key, the same retry creates a duplicate (the hazard being fixed)", async () => {
    const fake = dedupingAirwallex(true);
    const customer = await Effect.runPromise(
      createWithRetry(undefined).pipe(
        Effect.provide(AirwallexPayments.layer(config)),
        Effect.provide(fake.http),
      ),
    );
    expect(fake.sent[1]).not.toBe(fake.sent[0]);
    expect(fake.writes()).toBe(2);
    expect(customer.id).toBe("cus_2");
  });

  it("surfaces the lost response as PaymentNetworkError when the caller does not retry", async () => {
    const fake = dedupingAirwallex(true);
    const error = await Effect.runPromise(
      Customer.create({ email: "a@b.com", idempotencyKey: KEY }).pipe(
        Effect.flip,
        Effect.provide(AirwallexPayments.layer(config)),
        Effect.provide(fake.http),
      ),
    );
    expect(error).toBeInstanceOf(PaymentNetworkError);
    expect(fake.sent).toEqual([KEY]);
    expect(fake.writes()).toBe(1);
  });

  it("refuses a raw string key with PaymentInvalidRequestError before any request", async () => {
    const fake = dedupingAirwallex(false);
    const error = await Effect.runPromise(
      Customer.create({
        email: "a@b.com",
        idempotencyKey: "bad key" as IdempotencyKey.IdempotencyKey,
      }).pipe(
        Effect.flip,
        Effect.provide(AirwallexPayments.layer(config)),
        Effect.provide(fake.http),
      ),
    );
    expect(error).toBeInstanceOf(PaymentInvalidRequestError);
    expect(fake.sent).toEqual([]);
  });
});
