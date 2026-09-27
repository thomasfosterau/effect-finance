import { describe, it, expect } from "vite-plus/test";
import { Effect } from "effect";
import type Stripe from "stripe";
import * as TerminalLocation from "../src/Terminal.Location.ts";
import type { StripeRequest } from "../src/StripeHttp.ts";
import { fakeStripeHttp } from "./support.ts";

describe("Terminal.Location", () => {
  const createMockStripe = () => {
    const mockLocation: Stripe.Terminal.Location = {
      id: "tml_123",
      object: "terminal.location",
      display_name: "HQ",
      address: {
        line1: "1272 Valencia Street",
        city: "San Francisco",
        state: "CA",
        country: "US",
        postal_code: "94110",
      },
      livemode: false,
    } as Stripe.Terminal.Location;

    const mockDeletedLocation: Stripe.Terminal.DeletedLocation = {
      id: "tml_123",
      object: "terminal.location",
      deleted: true,
    };

    return (request: StripeRequest) => {
      if (request.method === "DELETE") return mockDeletedLocation;
      if (request.method === "GET" && request.path === "/v1/terminal/locations") {
        return {
          object: "list",
          data: [mockLocation],
          has_more: false,
          url: "/v1/terminal/locations",
        };
      }
      return mockLocation;
    };
  };

  const createTestLayer = (answer: (request: StripeRequest) => unknown) => fakeStripeHttp(answer);

  describe("create", () => {
    it("should create through the transport with correct params", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const params = {
        display_name: "HQ",
        address: {
          line1: "1272 Valencia Street",
          city: "San Francisco",
          state: "CA",
          country: "US",
          postal_code: "94110",
        },
      };

      const result = await Effect.runPromise(
        TerminalLocation.create(params).pipe(Effect.provide(layer)),
      );

      expect(calls[0]).toEqual({ method: "POST", path: "/v1/terminal/locations", params });
      expect(result.id).toBe("tml_123");
      expect(result.display_name).toBe("HQ");
    });
  });

  describe("retrieve", () => {
    it("should retrieve through the transport with correct id", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const result = await Effect.runPromise(
        TerminalLocation.retrieve("tml_123").pipe(Effect.provide(layer)),
      );

      expect(calls[0]).toEqual({
        method: "GET",
        path: "/v1/terminal/locations/tml_123",
        params: undefined,
      });
      expect(result.id).toBe("tml_123");
    });
  });

  describe("update", () => {
    it("should update through the transport with correct params", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const params = { display_name: "Updated HQ" };

      const result = await Effect.runPromise(
        TerminalLocation.update("tml_123", params).pipe(Effect.provide(layer)),
      );

      expect(calls[0]).toEqual({ method: "POST", path: "/v1/terminal/locations/tml_123", params });
      expect(result.id).toBe("tml_123");
    });
  });

  describe("del", () => {
    it("should delete through the transport with correct id", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const result = await Effect.runPromise(
        TerminalLocation.del("tml_123").pipe(Effect.provide(layer)),
      );

      expect(calls[0]).toEqual({ method: "DELETE", path: "/v1/terminal/locations/tml_123" });
      expect(result.deleted).toBe(true);
    });
  });

  describe("list", () => {
    it("should list through the transport with no params", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const result = await Effect.runPromise(TerminalLocation.list().pipe(Effect.provide(layer)));

      expect(calls[0]).toEqual({
        method: "GET",
        path: "/v1/terminal/locations",
        params: undefined,
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("tml_123");
    });

    it("should list through the transport with params", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const params = { limit: 10 };

      await Effect.runPromise(TerminalLocation.list(params).pipe(Effect.provide(layer)));

      expect(calls[0]).toEqual({ method: "GET", path: "/v1/terminal/locations", params });
    });
  });
});
