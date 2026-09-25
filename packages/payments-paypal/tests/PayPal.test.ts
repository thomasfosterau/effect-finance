import { describe, it, expect } from "vite-plus/test";
import { Effect } from "effect";
import { PaymentAuthenticationError, PaymentConfigError } from "@thomasfosterau/effect-payments";
import { make, type PayPalConfig } from "../src/PayPal.ts";

const jsonResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as Response;

/** A stub `fetch` that answers the OAuth token call then delegates to `handler`. */
const stubFetch = (
  handler: (url: string, init: RequestInit) => Response,
): { fetch: typeof fetch; calls: Array<{ url: string; init: RequestInit }> } => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const resolvedInit = init ?? {};
    calls.push({ url, init: resolvedInit });
    if (url.endsWith("/v1/oauth2/token")) {
      return jsonResponse(200, { access_token: "at_1", expires_in: 3600 });
    }
    return handler(url, resolvedInit);
  }) as typeof fetch;
  return { fetch: fetchImpl, calls };
};

const config = (over: Partial<PayPalConfig>): PayPalConfig => ({
  clientId: "client_1",
  clientSecret: "secret_1",
  ...over,
});

describe("PayPal client", () => {
  it("exchanges credentials for a token and authorizes requests", async () => {
    const { fetch: fetchImpl, calls } = stubFetch(() =>
      jsonResponse(200, { id: "PROD-1", name: "Premium" }),
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({ fetch: fetchImpl }));
        return yield* client.request<{ id: string }>({
          method: "GET",
          path: "/v1/catalogs/products/PROD-1",
        });
      }),
    );
    expect(result.id).toBe("PROD-1");

    const token = calls.find((c) => c.url.endsWith("/v1/oauth2/token"))!;
    const expectedBasic = Buffer.from("client_1:secret_1").toString("base64");
    expect((token.init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${expectedBasic}`,
    );
    expect(token.init.body).toBe("grant_type=client_credentials");

    const resource = calls.find((c) => c.url.includes("/catalogs/products"))!;
    expect((resource.init.headers as Record<string, string>).Authorization).toBe("Bearer at_1");
  });

  it("maps an HTTP 401 to a neutral authentication error", async () => {
    const { fetch: fetchImpl } = stubFetch(() =>
      jsonResponse(401, { name: "NOT_AUTHORIZED", message: "invalid token" }),
    );

    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({ fetch: fetchImpl }));
        return yield* client.request({
          method: "GET",
          path: "/v1/catalogs/products/PROD-1",
        });
      }).pipe(Effect.flip),
    );

    expect(error).toBeInstanceOf(PaymentAuthenticationError);
    expect(error.message).toBe("invalid token");
  });

  it("fails with a config error when credentials are missing", async () => {
    const error = await Effect.runPromise(
      make(config({ clientId: "", clientSecret: "" })).pipe(Effect.flip),
    );
    expect(error).toBeInstanceOf(PaymentConfigError);
  });
});
