import { describe, expect, it } from "vite-plus/test";
// oxlint-disable-next-line effect/use-filesystem-service -- a test inspecting the package's own files, outside any Effect runtime
import { readFileSync } from "node:fs";
import { DEFAULT_API_VERSION } from "../src/StripeHttp.ts";
import generatorPackage from "@effect/openapi-generator/package.json" with { type: "json" };
import pin from "../scripts/stripe-spec.json" with { type: "json" };

/**
 * The generated schemas (#56) are a pure function of the pin in
 * `scripts/stripe-spec.json`. Regenerating needs the 7 MB spec, so CI does not;
 * this keeps the committed file, the pin and the transport's default API
 * version from drifting apart.
 */
// oxlint-disable-next-line effect/avoid-sync-fs -- see the import
const generated = readFileSync(
  new URL("../src/internal/generated/schemas.ts", import.meta.url),
  "utf8",
);

describe("generated Stripe schemas", () => {
  it("is marked generated and records the pinned spec it came from", () => {
    expect(generated).toContain("GENERATED FILE - DO NOT EDIT");
    expect(generated).toContain(`tag         ${pin.tag} (${pin.commit})`);
    expect(generated).toContain(`API version ${pin.apiVersion}`);
    expect(generated).toContain(`spec sha256 ${pin.sha256}`);
    expect(generated).toContain(`paths       ${pin.paths.join(", ")}`);
  });

  it("records the generator version it ran with", () => {
    expect(generated).toContain(`@effect/openapi-generator\` ${generatorPackage.version} `);
  });

  it("pins a full commit and a SHA-256", () => {
    expect(pin.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(pin.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is pinned to the transport's default API version", () => {
    expect(pin.apiVersion).toBe(DEFAULT_API_VERSION);
    expect(DEFAULT_API_VERSION).toMatch(/\.basil$/);
  });

  it("makes response enumerations lenient and top-level schemas tree-shakeable", () => {
    expect(generated).toContain("Enumeration.fromWire(Schema.Literals([");
    const constants = generated.split("\n").filter((line) => line.startsWith("export const "));
    const pure = constants.filter((line) => line.includes("= /* @__PURE__ */ "));
    expect(pure.length).toBeGreaterThan(50);
    expect(constants.filter((line) => /= (?:Schema|Enumeration)\./.test(line))).toEqual([]);
  });

  it("contains schemas only, no generated HTTP client", () => {
    expect(generated).not.toContain("HttpClient");
    expect(generated).toContain("export const Checkout_session = ");
    expect(generated).toContain("export const Billing_portal_session = ");
  });
});
