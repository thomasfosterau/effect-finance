import { describe, expect, it } from "vite-plus/test";
import { Effect, Exit } from "effect";
import { PaymentProviderError } from "@thomasfosterau/effect-payments";
import * as BillingPortalSession from "../src/BillingPortal.Session.ts";
import { fakeStripeHttp } from "./support.ts";
import billingPortalSession from "./fixtures/basil/billing-portal-session.json" with { type: "json" };

const create = (respond: () => unknown) => {
  const http = fakeStripeHttp(respond);
  const exit = Effect.runPromiseExit(
    BillingPortalSession.create({
      customer: "cus_QxAbCdEfGhIjKl",
      return_url: "https://example.com/account",
    }).pipe(Effect.provide(http.layer)),
  );
  return { http, exit };
};

describe("BillingPortal.Session (generated basil types)", () => {
  it("decodes a real-shaped 2025-08-27.basil portal session", async () => {
    const { http, exit } = create(() => billingPortalSession);
    const result = await exit;
    expect(Exit.isSuccess(result)).toBe(true);
    if (!Exit.isSuccess(result)) return;
    expect(result.value.url).toBe("https://billing.stripe.com/p/session/test_YWNjdF8xU0FCY0RF");
    expect(result.value.customer).toBe("cus_QxAbCdEfGhIjKl");
    expect(http.calls[0]).toMatchObject({
      method: "POST",
      path: "/v1/billing_portal/sessions",
      params: { customer: "cus_QxAbCdEfGhIjKl" },
    });
  });

  it("fails with PaymentProviderError when the session has no url", async () => {
    const { url: _url, ...withoutUrl } = billingPortalSession;
    const result = await create(() => withoutUrl).exit;
    expect(Exit.isFailure(result)).toBe(true);
    const failure = Exit.isFailure(result)
      ? result.cause.reasons.map((reason) => ("error" in reason ? reason.error : undefined))[0]
      : undefined;
    expect(failure).toBeInstanceOf(PaymentProviderError);
    expect(failure).toMatchObject({
      provider: "stripe",
      message: "Stripe returned a malformed billing portal session response",
    });
  });
});
