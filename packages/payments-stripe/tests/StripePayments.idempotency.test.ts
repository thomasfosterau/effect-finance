import { describe, it, expect } from "vite-plus/test";
import { Effect, type Layer, Redacted } from "effect";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as Product from "@thomasfosterau/effect-payments/Product";
import * as Price from "@thomasfosterau/effect-payments/Price";
import * as PaymentIntent from "@thomasfosterau/effect-payments/PaymentIntent";
import * as Subscription from "@thomasfosterau/effect-payments/Subscription";
import * as Refund from "@thomasfosterau/effect-payments/Refund";
import * as CheckoutSession from "@thomasfosterau/effect-payments/CheckoutSession";
import * as IdempotencyKey from "@thomasfosterau/effect-payments/IdempotencyKey";
import {
  PaymentInvalidRequestError,
  PaymentNetworkError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import * as StripePayments from "../src/StripePayments.ts";
import { fakeStripeHttp, jsonResponse, stubFetch } from "./support.ts";

/**
 * The neutral `idempotencyKey` (#55, closing #66) on the create and confirm
 * operations: mapped onto Stripe's `Idempotency-Key`, and a retried write
 * after a lost response is one logical write.
 */

const KEY = IdempotencyKey.IdempotencyKey.make("write-0001");

/** Run one operation against a fake transport and return the request it made. */
const requestOf = async (
  operation: Effect.Effect<unknown, unknown, Capabilities>,
): Promise<{ readonly idempotencyKey: string | undefined; readonly count: number }> => {
  const fake = fakeStripeHttp(() => ({}));
  // The empty answer fails the decode; the request was recorded before that.
  await Effect.runPromise(
    Effect.exit(
      operation.pipe(Effect.provide(StripePayments.capabilities), Effect.provide(fake.layer)),
    ),
  );
  return { idempotencyKey: fake.calls[0]?.idempotencyKey, count: fake.calls.length };
};
type Capabilities = Layer.Success<typeof StripePayments.capabilities>;

const operations = (
  idempotencyKey: IdempotencyKey.IdempotencyKey | undefined,
): ReadonlyArray<readonly [string, Effect.Effect<unknown, PaymentsError, Capabilities>]> => [
  ["Customer.create", Customer.create({ email: "a@example.com", idempotencyKey })],
  ["Product.create", Product.create({ name: "P", idempotencyKey })],
  [
    "Price.create",
    Price.create({ product: "prod_1", currency: "usd", unitAmount: 100, idempotencyKey }),
  ],
  ["PaymentIntent.create", PaymentIntent.create({ amount: 100, currency: "usd", idempotencyKey })],
  ["PaymentIntent.confirm", PaymentIntent.confirm("pi_1", { idempotencyKey })],
  [
    "Subscription.create",
    Subscription.create({ customer: "cus_1", items: [{ price: "price_1" }], idempotencyKey }),
  ],
  ["Refund.create", Refund.create({ paymentIntent: "pi_1", idempotencyKey })],
  [
    "CheckoutSession.create",
    CheckoutSession.create({
      mode: "payment",
      lineItems: [{ price: "price_1" }],
      successUrl: "https://example.com/ok",
      cancelUrl: "https://example.com/no",
      idempotencyKey,
    }),
  ],
];

describe("Stripe maps the neutral idempotencyKey to Idempotency-Key", () => {
  it.each(operations(KEY).map(([name]) => name))("%s", async (name) => {
    const op = operations(KEY).find(([candidate]) => candidate === name)![1];
    expect(await requestOf(op)).toEqual({ idempotencyKey: KEY, count: 1 });
  });

  it.each(operations(undefined).map(([name]) => name))(
    "%s sends none without a key",
    async (name) => {
      const op = operations(undefined).find(([candidate]) => candidate === name)![1];
      expect(await requestOf(op)).toEqual({ idempotencyKey: undefined, count: 1 });
    },
  );

  it.each(operations(undefined).map(([name]) => name))(
    "%s refuses a raw string before sending anything",
    async (name) => {
      // Untyped code can still pass a string the brand would have refused.
      const bad = "not a valid key" as IdempotencyKey.IdempotencyKey;
      const op = operations(bad).find(([candidate]) => candidate === name)![1];
      const fake = fakeStripeHttp(() => ({}));
      const error = await Effect.runPromise(
        Effect.flip(
          op.pipe(Effect.provide(StripePayments.capabilities), Effect.provide(fake.layer)),
        ),
      );
      expect(error).toBeInstanceOf(PaymentInvalidRequestError);
      expect(fake.calls).toEqual([]);
    },
  );

  it("sends none on the cancel operations", async () => {
    const fake = fakeStripeHttp(() => ({}));
    await Effect.runPromise(
      Effect.exit(
        Effect.gen(function* () {
          yield* Effect.exit(Subscription.cancel("sub_1"));
          yield* Effect.exit(PaymentIntent.cancel("pi_1"));
        }).pipe(Effect.provide(StripePayments.capabilities), Effect.provide(fake.layer)),
      ),
    );
    expect(fake.calls.map((call) => call.idempotencyKey)).toEqual([undefined, undefined]);
  });
});

describe("a retried write after a lost response is one logical write (#66)", () => {
  const customer = {
    id: "cus_1",
    email: "a@example.com",
    name: null,
    phone: null,
    description: null,
    metadata: {},
    created: 1,
    livemode: false,
  };

  /**
   * A fake Stripe that dedupes by `Idempotency-Key`: the first request with a
   * key applies the write and remembers the answer, a repeat returns the
   * remembered answer. `loseFirstResponse` drops the answer to the first
   * attempt, as a timeout would: the write happened, the caller never saw it.
   */
  const dedupingStripe = (loseFirstResponse: boolean) => {
    const seen = new Map<string, Response>();
    let writes = 0;
    let attempts = 0;
    const stub = stubFetch((request) => {
      attempts += 1;
      const key = request.headers.get("idempotency-key");
      const remembered = key === null ? undefined : seen.get(key);
      const response =
        remembered ??
        (() => ((writes += 1), jsonResponse(200, { ...customer, id: `cus_${writes}` })))();
      if (key !== null && remembered === undefined) seen.set(key, response.clone());
      if (loseFirstResponse && attempts === 1) throw new TypeError("fetch failed");
      return response.clone();
    });
    return { ...stub, writes: () => writes };
  };

  /** Create a customer, retrying once on a network error, with `key` for every attempt. */
  const createWithRetry = (key: IdempotencyKey.IdempotencyKey | undefined) =>
    Customer.create({ email: "a@example.com", idempotencyKey: key }).pipe(
      Effect.retry({ while: (error) => error._tag === "PaymentNetworkError", times: 1 }),
    );

  it("with one key reused on the retry, the provider applies it once", async () => {
    const fake = dedupingStripe(true);
    const created = await Effect.runPromise(
      Effect.gen(function* () {
        const key = yield* IdempotencyKey.generate; // once per logical write
        return yield* createWithRetry(key);
      }).pipe(
        Effect.provide(
          StripePayments.layer({
            apiKey: Redacted.make("sk_test_not_a_real_key"),
            maxNetworkRetries: 0,
          }),
        ),
        Effect.provide(fake.http),
      ),
    );
    expect(created.id).toBe("cus_1");
    expect(fake.writes()).toBe(1);
    const keys = fake.calls.map((call) => call.headers.get("idempotency-key"));
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
  });

  it("without a key, the same retry creates a duplicate (the hazard being fixed)", async () => {
    const fake = dedupingStripe(true);
    const created = await Effect.runPromise(
      createWithRetry(undefined).pipe(
        Effect.provide(
          StripePayments.layer({
            apiKey: Redacted.make("sk_test_not_a_real_key"),
            maxNetworkRetries: 0,
          }),
        ),
        Effect.provide(fake.http),
      ),
    );
    expect(fake.writes()).toBe(2);
    expect(created.id).toBe("cus_2");
  });

  it("surfaces the lost response as PaymentNetworkError when the caller does not retry", async () => {
    const fake = dedupingStripe(true);
    const error = await Effect.runPromise(
      Customer.create({ email: "a@example.com", idempotencyKey: KEY }).pipe(
        Effect.flip,
        Effect.provide(
          StripePayments.layer({
            apiKey: Redacted.make("sk_test_not_a_real_key"),
            maxNetworkRetries: 0,
          }),
        ),
        Effect.provide(fake.http),
      ),
    );
    expect(error).toBeInstanceOf(PaymentNetworkError);
    expect(fake.writes()).toBe(1);
  });
});
