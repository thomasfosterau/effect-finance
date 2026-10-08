import { describe, it, expect, expectTypeOf } from "vite-plus/test";
// oxlint-disable-next-line effect/use-filesystem-service -- a test reading an installed package's manifest, outside any Effect runtime
import { readFileSync } from "node:fs";
// oxlint-disable-next-line effect/avoid-node-imports -- see the import above
import { createRequire } from "node:module";
import { Schema } from "effect";
import type { CreateWebhookEndpointRequestApiVersion } from "@distilled.cloud/stripe/stripe";
import { DISTILLED_API_VERSION } from "../src/StripePayments.ts";

/**
 * The capability layers pin `Stripe-Version` to the API version the pinned
 * Distilled release is generated from (owner decision on #146: follow
 * Distilled). Distilled exposes no such constant, so this table records it
 * per release: the `version` of the `com.stripe.api#Stripe` service in
 * `packages/stripe/.generated-specs/stripe.json` at the release's commit in
 * alchemy-run/distilled (`e02e9d40` for `1.0.0-rc.13`).
 */
const FOLLOWED = new Map([["1.0.0-rc.13", "2026-07-29.dahlia"]]);

const Manifest = Schema.Struct({
  name: Schema.Literal("@distilled.cloud/stripe"),
  version: Schema.String,
});

/**
 * The installed `@distilled.cloud/stripe` version, from the manifest beside
 * its entry point (`lib/index.js`): the package exports no `./package.json`.
 */
const installedVersion = (): string => {
  const entry = createRequire(import.meta.url).resolve("@distilled.cloud/stripe");
  // oxlint-disable-next-line effect/avoid-sync-fs -- see the import
  const text = readFileSync(new URL("../package.json", `file://${entry}`), "utf8");
  return Schema.decodeUnknownSync(Schema.fromJsonString(Manifest))(text).version;
};

describe("DISTILLED_API_VERSION", () => {
  const installed = installedVersion();

  it("is the API version the installed Distilled release is generated from", () => {
    const followed = FOLLOWED.get(installed);
    if (followed === undefined) {
      expect.fail(
        `@distilled.cloud/stripe ${installed} is installed, but the API version it is generated ` +
          `from is not recorded. Look it up (the com.stripe.api#Stripe service's version in ` +
          `packages/stripe/.generated-specs/stripe.json at its release commit), then update ` +
          `DISTILLED_API_VERSION in src/internal/apiVersion.ts and the FOLLOWED table in this ` +
          `file together, and check that the fields src/internal/mapping.ts reads still exist.`,
      );
    }
    expect(DISTILLED_API_VERSION).toBe(followed);
  });

  it("is a version Distilled's own types know", () => {
    expectTypeOf<typeof DISTILLED_API_VERSION>().toExtend<CreateWebhookEndpointRequestApiVersion>();
  });
});
