import { describe, it, expect } from "vite-plus/test";
import { Effect } from "effect";
import type Stripe from "stripe";
import * as TerminalReader from "../src/Terminal.Reader.ts";
import type { StripeRequest } from "../src/StripeHttp.ts";
import { fakeStripeHttp } from "./support.ts";

describe("Terminal.Reader", () => {
  const createMockStripe = () => {
    const mockReader: Stripe.Terminal.Reader = {
      id: "tmr_123",
      object: "terminal.reader",
      device_type: "bbpos_wisepos_e",
      label: "Test Reader",
      location: "tml_123",
      status: "online",
      livemode: false,
    } as Stripe.Terminal.Reader;

    const mockDeletedReader: Stripe.Terminal.DeletedReader = {
      id: "tmr_123",
      object: "terminal.reader",
      deleted: true,
    };

    return (request: StripeRequest) => {
      if (request.method === "DELETE") return mockDeletedReader;
      if (request.method === "GET" && request.path === "/v1/terminal/readers") {
        return { object: "list", data: [mockReader], has_more: false, url: "/v1/terminal/readers" };
      }
      return mockReader;
    };
  };

  const createTestLayer = (answer: (request: StripeRequest) => unknown) => fakeStripeHttp(answer);

  describe("create", () => {
    it("should create through the transport with correct params", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const params = {
        registration_code: "simulated-wpe",
        location: "tml_123",
        label: "Test Reader",
      };

      const result = await Effect.runPromise(
        TerminalReader.create(params).pipe(Effect.provide(layer)),
      );

      expect(calls[0]).toEqual({ method: "POST", path: "/v1/terminal/readers", params });
      expect(result.id).toBe("tmr_123");
    });
  });

  describe("retrieve", () => {
    it("should retrieve through the transport with correct id", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const result = await Effect.runPromise(
        TerminalReader.retrieve("tmr_123").pipe(Effect.provide(layer)),
      );

      expect(calls[0]).toEqual({
        method: "GET",
        path: "/v1/terminal/readers/tmr_123",
        params: undefined,
      });
      expect(result.id).toBe("tmr_123");
    });
  });

  describe("update", () => {
    it("should update through the transport with correct params", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const params = { label: "Updated Reader" };

      const result = await Effect.runPromise(
        TerminalReader.update("tmr_123", params).pipe(Effect.provide(layer)),
      );

      expect(calls[0]).toEqual({ method: "POST", path: "/v1/terminal/readers/tmr_123", params });
      expect(result.id).toBe("tmr_123");
    });
  });

  describe("del", () => {
    it("should delete through the transport with correct id", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const result = await Effect.runPromise(
        TerminalReader.del("tmr_123").pipe(Effect.provide(layer)),
      );

      expect(calls[0]).toEqual({ method: "DELETE", path: "/v1/terminal/readers/tmr_123" });
      expect(result.deleted).toBe(true);
    });
  });

  describe("list", () => {
    it("should list through the transport with no params", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const result = await Effect.runPromise(TerminalReader.list().pipe(Effect.provide(layer)));

      expect(calls[0]).toEqual({ method: "GET", path: "/v1/terminal/readers", params: undefined });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("tmr_123");
    });

    it("should list through the transport with params", async () => {
      const { layer, calls } = createTestLayer(createMockStripe());

      const params = { limit: 10 };

      await Effect.runPromise(TerminalReader.list(params).pipe(Effect.provide(layer)));

      expect(calls[0]).toEqual({ method: "GET", path: "/v1/terminal/readers", params });
    });
  });
});
