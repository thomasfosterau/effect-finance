import { describe, it, expect } from "vite-plus/test";
import { Effect, Redacted } from "effect";
import {
  PaymentInvalidRequestError,
  PaymentProviderError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { installed } from "../scripts/distilled.ts";
import { type Planned, plan, readOperations } from "../scripts/resources.ts";
import { DISTILLED_API_VERSION, layer, type StripeHttp } from "../src/StripeHttp.ts";
import { type CapturedRequest, jsonResponse, stubFetch, TEST_KEY } from "./support.ts";

/**
 * Every operation of every resource module on the wire (#146): called with
 * placeholder ids (and empty params where it takes any) over
 * `StripeHttp.layer` and a stubbed `fetch`, it must reach its method and path
 * with the key and `Stripe-Version: DISTILLED_API_VERSION`, and resolve to
 * the body as sent. Each module's first operation must also map a Stripe
 * error and a malformed 2xx onto the neutral channel.
 */

const distilled = installed();
const { modules } = plan(readOperations(distilled.declarations, distilled.module));

/** A module's operation as its export: ids, then params, then options. */
type Exported = (
  ...args: ReadonlyArray<unknown>
) => Effect.Effect<unknown, PaymentsError, StripeHttp>;

const load = async (subpath: string): Promise<Readonly<Record<string, Exported>>> =>
  // SAFETY: every generated module exports its operations as functions of this shape.
  (await import(`../src/${subpath}.ts`)) as Readonly<Record<string, Exported>>;

/** The arguments of a call: an id per path id, `{}` for params, no options. */
const argsOf = (operation: Planned): ReadonlyArray<unknown> => [
  ...operation.ids.map((_, index) => `id_${index + 1}`),
  ...(operation.params === "none" ? [] : [{}]),
];

/** The path the call must reach, its ids substituted in order. */
const pathOf = (operation: Planned): string =>
  operation.ids.reduce(
    (path, _, index) => path.replace(/\{[^}]+\}/, `id_${index + 1}`),
    operation.path,
  );

/** Run one call over a stubbed `fetch`, never retried. */
const run = (
  call: Effect.Effect<unknown, PaymentsError, StripeHttp>,
  respond: (request: CapturedRequest) => Response,
) => {
  const { http, calls } = stubFetch(respond);
  const exit = Effect.runPromise(
    Effect.exit(
      call.pipe(
        Effect.provide(layer({ apiKey: Redacted.make(TEST_KEY), maxNetworkRetries: 0 })),
        Effect.provide(http),
      ),
    ),
  );
  return { exit, calls };
};

const BODY = { id: "obj_1", object: "stub", livemode: false };

describe.each([...modules])("%s", (subpath, operations) => {
  it.each(operations.map((operation) => [operation.exported, operation] as const))(
    "%s reaches its route with the pinned Stripe-Version",
    async (exported, operation) => {
      const module = await load(subpath);
      const call = module[exported];
      expect(call, `${subpath}.${exported}`).toBeTypeOf("function");
      const { exit, calls } = run(call!(...argsOf(operation)), () => jsonResponse(200, BODY));
      expect(await exit).toEqual(expect.objectContaining({ _tag: "Success", value: BODY }));
      expect(calls).toHaveLength(1);
      const [request] = calls;
      expect(request?.method).toBe(operation.method);
      expect(request?.url.origin).toBe(
        operation.upload ? "https://files.stripe.com" : "https://api.stripe.com",
      );
      expect(request?.url.pathname).toBe(pathOf(operation));
      expect(request?.headers.get("stripe-version")).toBe(DISTILLED_API_VERSION);
      expect(request?.headers.get("authorization")).toBe(`Bearer ${TEST_KEY}`);
    },
  );

  const [first] = operations;

  it(`maps a Stripe error from ${first?.exported} onto PaymentInvalidRequestError`, async () => {
    const module = await load(subpath);
    const { exit } = run(module[first!.exported]!(...argsOf(first!)), () =>
      jsonResponse(400, {
        error: { type: "invalid_request_error", message: "No such thing", param: "id" },
      }),
    );
    const result = await exit;
    expect(result._tag).toBe("Failure");
    const error = result._tag === "Failure" ? result.cause.reasons[0] : undefined;
    expect(error).toMatchObject({ _tag: "Fail", error: expect.any(PaymentInvalidRequestError) });
    expect(error).toMatchObject({ error: { message: "No such thing", param: "id" } });
  });

  it(`fails a malformed 2xx from ${first?.exported} with PaymentProviderError`, async () => {
    const module = await load(subpath);
    const { exit } = run(
      module[first!.exported]!(...argsOf(first!)),
      () => new Response("<html>not json</html>", { status: 200 }),
    );
    const result = await exit;
    const error = result._tag === "Failure" ? result.cause.reasons[0] : undefined;
    expect(error).toMatchObject({
      _tag: "Fail",
      error: expect.any(PaymentProviderError),
    });
    expect(error).toMatchObject({
      error: { message: "Invalid JSON received from the Stripe API", statusCode: 200 },
    });
  });
});
