import { describe, it, expect } from "vite-plus/test";
import { Effect } from "effect";
import { PaymentAuthenticationError, PaymentConfigError } from "@thomasfosterau/effect-payments";
import { make, type AirwallexConfig } from "../src/Airwallex.ts";

const jsonResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as Response;

/** A stub `fetch` that answers the login handshake then delegates to `handler`. */
const stubFetch = (
  handler: (url: string, init: RequestInit) => Response,
): { fetch: typeof fetch; calls: Array<{ url: string; init: RequestInit }> } => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const resolvedInit = init ?? {};
    calls.push({ url, init: resolvedInit });
    if (url.endsWith("/api/v1/authentication/login")) {
      return jsonResponse(201, {
        token: "tok_123",
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
    }
    return handler(url, resolvedInit);
  }) as typeof fetch;
  return { fetch: fetchImpl, calls };
};

const config = (over: Partial<AirwallexConfig>): AirwallexConfig => ({
  clientId: "client_1",
  apiKey: "key_1",
  ...over,
});

describe("Airwallex client", () => {
  it("logs in once, caches the token, and authorizes requests", async () => {
    const { fetch: fetchImpl, calls } = stubFetch((_url) =>
      jsonResponse(200, { id: "cus_1", email: "a@b.com" }),
    );

    const program = Effect.gen(function* () {
      const client = yield* make(config({ fetch: fetchImpl }));
      const first = yield* client.request<{ id: string }>({
        method: "GET",
        path: "/api/v1/pa/customers/cus_1",
      });
      const second = yield* client.request<{ id: string }>({
        method: "GET",
        path: "/api/v1/pa/customers/cus_1",
      });
      return { first, second };
    });

    const result = await Effect.runPromise(program);
    expect(result.first.id).toBe("cus_1");

    // One login + two resource requests, and the token only fetched once.
    const logins = calls.filter((c) => c.url.endsWith("/authentication/login"));
    expect(logins).toHaveLength(1);
    const resourceCall = calls.find((c) => c.url.includes("/pa/customers"))!;
    expect((resourceCall.init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok_123",
    );
  });

  it("sends client credentials on the login request", async () => {
    const { fetch: fetchImpl, calls } = stubFetch(() =>
      jsonResponse(200, { items: [], has_more: false }),
    );

    await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({ fetch: fetchImpl }));
        yield* client.request({ method: "GET", path: "/api/v1/pa/customers" });
      }),
    );

    const login = calls.find((c) => c.url.endsWith("/authentication/login"))!;
    const headers = login.init.headers as Record<string, string>;
    expect(headers["x-client-id"]).toBe("client_1");
    expect(headers["x-api-key"]).toBe("key_1");
  });

  it("maps an HTTP 401 to a neutral authentication error", async () => {
    const { fetch: fetchImpl } = stubFetch(() =>
      jsonResponse(401, { code: "unauthorized", message: "invalid token" }),
    );

    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* make(config({ fetch: fetchImpl }));
        return yield* client.request({
          method: "GET",
          path: "/api/v1/pa/customers/cus_1",
        });
      }).pipe(Effect.flip),
    );

    expect(error).toBeInstanceOf(PaymentAuthenticationError);
    expect(error.message).toBe("invalid token");
  });

  it("fails with a config error when credentials are missing", async () => {
    const error = await Effect.runPromise(
      make(config({ clientId: "", apiKey: "" })).pipe(Effect.flip),
    );
    expect(error).toBeInstanceOf(PaymentConfigError);
  });
});
