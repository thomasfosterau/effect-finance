import { describe, it, expect } from "vite-plus/test";
// oxlint-disable-next-line effect/use-filesystem-service -- a test comparing generated sources with the files on disk, outside any Effect runtime
import { readdirSync, readFileSync } from "node:fs";
import { Effect } from "effect";
import { installed } from "../scripts/distilled.ts";
import {
  OVERRIDES,
  plan,
  readOperations,
  render,
  RESOURCES,
  runtimeOperations,
  UNEXPOSED,
} from "../scripts/resources.ts";

/**
 * The resource modules are generated from the installed Distilled release
 * (`scripts/generate-resources.ts`, #146): every Distilled operation is placed
 * in exactly one module or listed as unexposed, and the modules on disk are
 * what the generator writes. A Distilled bump that adds, moves or renames an
 * operation fails here until `scripts/resources.ts` decides where it goes and
 * the modules are regenerated (`generate:resources`).
 */

const distilled = installed();
const operations = readOperations(distilled.declarations, distilled.module);
const planned = plan(operations);
const PACKAGE = new URL("../", import.meta.url);

/** Exported names, by resource subpath. */
type Kept = Readonly<Record<string, ReadonlyArray<string>>>;

/** The names each module exported before the modules re-exported Distilled, kept by the rule and {@link OVERRIDES}. */
const KEPT = {
  Account: ["create", "retrieve", "update", "del", "list"],
  AccountLink: ["create"],
  Balance: ["retrieve"],
  BalanceTransaction: ["retrieve", "list"],
  "BillingPortal.Session": ["create"],
  Charge: ["create", "retrieve", "update", "list"],
  CheckoutSession: ["create", "retrieve", "expire", "list"],
  CountrySpec: ["retrieve", "list"],
  Coupon: ["create", "retrieve", "update", "del", "list"],
  Customer: ["create", "retrieve", "update", "del", "list"],
  Dispute: ["retrieve", "update", "list"],
  Event: ["retrieve", "list"],
  ExternalAccount: ["create", "retrieve", "update", "del", "list"],
  File: ["create", "retrieve", "list"],
  "Identity.VerificationReport": ["retrieve", "list"],
  "Identity.VerificationSession": ["create", "retrieve", "update", "cancel", "redact", "list"],
  Invoice: ["create", "retrieve", "update", "del", "list"],
  "Issuing.Authorization": ["retrieve", "update", "list"],
  "Issuing.Card": ["create", "retrieve", "update", "list"],
  "Issuing.Cardholder": ["create", "retrieve", "update", "list"],
  "Issuing.Dispute": ["create", "retrieve", "update", "list"],
  "Issuing.Transaction": ["retrieve", "update", "list"],
  PaymentIntent: ["create", "retrieve", "update", "confirm", "cancel", "list"],
  PaymentMethod: ["create", "retrieve", "update", "attach", "detach", "list"],
  Payout: ["create", "retrieve", "update", "cancel", "list"],
  Person: ["create", "retrieve", "update", "del", "list"],
  Price: ["create", "retrieve", "update", "list"],
  Product: ["create", "retrieve", "update", "del", "list"],
  PromotionCode: ["create", "retrieve", "update", "list"],
  Refund: ["create", "retrieve", "update", "list"],
  Review: ["retrieve", "list", "approve"],
  SetupIntent: ["create", "retrieve", "update", "confirm", "cancel", "list"],
  Subscription: ["create", "retrieve", "update", "cancel", "list"],
  SubscriptionSchedule: ["create", "retrieve", "update", "cancel", "release", "list"],
  TaxRate: ["create", "retrieve", "update", "list"],
  "Terminal.ConnectionToken": ["create"],
  "Terminal.Location": ["create", "retrieve", "update", "del", "list"],
  "Terminal.Reader": ["create", "retrieve", "update", "del", "list"],
  Topup: ["create", "retrieve", "update", "list"],
  Transfer: ["create", "retrieve", "update", "list"],
  "Treasury.FinancialAccount": [
    "create",
    "retrieve",
    "update",
    "list",
    "close",
    "retrieveFeatures",
    "updateFeatures",
  ],
  "Treasury.InboundTransfer": ["create", "retrieve", "list", "cancel"],
  "Treasury.OutboundTransfer": ["create", "retrieve", "list", "cancel"],
  "Treasury.Transaction": ["retrieve", "list"],
  WebhookEndpoint: ["create", "retrieve", "update", "del", "list"],
} satisfies Kept;

describe("the resource plan", () => {
  it("reads every operation Distilled exports", () => {
    expect(operations.map((operation) => operation.name).sort()).toEqual(
      runtimeOperations(distilled.module),
    );
    expect(operations.length).toBeGreaterThan(500);
  });

  it("places every operation in one module or lists it as unexposed, with no problem", () => {
    expect(planned.problems).toEqual([]);
    const exposed = [...planned.modules.values()].flat().map((operation) => operation.name);
    expect(new Set(exposed).size).toBe(exposed.length);
    expect([...exposed, ...planned.unexposed].sort()).toEqual(runtimeOperations(distilled.module));
  });

  it("reports an operation under no listed path", () => {
    const stray = {
      ...operations[0]!,
      name: "CreateWidget",
      path: "/v1/widgets",
      method: "POST" as const,
    };
    expect(plan([...operations, stray]).problems).toEqual([
      "CreateWidget (POST /v1/widgets) is in no resource module and not listed as unexposed",
    ]);
  });

  it("reports two operations that would share a name", () => {
    const twin = {
      ...operations.find((operation) => operation.name === "GetCustomer")!,
      name: "GetCustomerAgain",
    };
    expect(plan([...operations, twin]).problems).toContain(
      "GetCustomerAgain and GetCustomer would both be Customer.retrieve",
    );
  });

  it("has a module for every resource subpath the package publishes, and nothing else", () => {
    // SAFETY: the manifest carries an `exports` map.
    // oxlint-disable-next-line effect/avoid-sync-fs -- see the import
    const manifest = JSON.parse(readFileSync(new URL("package.json", PACKAGE), "utf8")) as {
      readonly exports: Record<string, unknown>;
    };
    const published = Object.keys(manifest.exports).map((key) => key.replace(/^\.\/?/, ""));
    const resources = RESOURCES.map((resource) => resource.subpath);
    expect(published.filter((key) => !resources.includes(key)).sort()).toEqual([
      "",
      "StripeHttp",
      "StripePayments",
      "Treasury",
      "Webhook",
    ]);
    expect(resources.every((subpath) => published.includes(subpath))).toBe(true);
  });

  it("keeps every name a module exported before (#146)", () => {
    for (const [subpath, names] of Object.entries(KEPT)) {
      const exported = (planned.modules.get(subpath) ?? []).map((operation) => operation.exported);
      expect(exported, subpath).toEqual(expect.arrayContaining([...names]));
    }
    expect(Object.keys(KEPT).sort()).toEqual(RESOURCES.map((resource) => resource.subpath).sort());
  });

  it("exposes the Invoice and Subscription actions (#142)", () => {
    const names = (subpath: string) =>
      (planned.modules.get(subpath) ?? []).map((operation) => operation.exported);
    expect(names("Invoice")).toEqual(
      expect.arrayContaining([
        "finalize",
        "pay",
        "voidInvoice",
        "send",
        "markUncollectible",
        "listLines",
        "createPreview",
        "search",
      ]),
    );
    expect(names("Subscription")).toEqual(expect.arrayContaining(["resume", "migrate", "search"]));
  });

  it("names each API path and each subpath in RESOURCES once", () => {
    const paths = RESOURCES.flatMap((resource) => resource.paths);
    expect(paths.filter((path, index) => paths.indexOf(path) !== index)).toEqual([]);
    const subpaths = RESOURCES.map((resource) => resource.subpath);
    expect(subpaths.filter((subpath, index) => subpaths.indexOf(subpath) !== index)).toEqual([]);
  });

  it("lists only paths no module holds as unexposed", () => {
    const held = RESOURCES.flatMap((resource) => resource.paths);
    expect(
      UNEXPOSED.filter((path) =>
        held.some((prefix) => prefix.startsWith(`${path}/`) || prefix === path),
      ),
    ).toEqual([]);
    expect(Object.keys(OVERRIDES).length).toBeGreaterThan(0);
  });
});

describe("the generated resource modules", () => {
  it("are what the generator writes from the installed Distilled release", async () => {
    const files = await Effect.runPromise(render(planned, distilled.version));
    expect(files.size).toBe(RESOURCES.length);
    for (const [file, code] of files) {
      // oxlint-disable-next-line effect/avoid-sync-fs -- see the import
      const onDisk = readFileSync(new URL(file, PACKAGE), "utf8");
      expect(onDisk, `${file} is stale: run generate:resources`).toBe(code);
    }
  });

  it("leave no stale module behind", () => {
    // oxlint-disable-next-line effect/avoid-sync-fs -- see the import
    const generated = readdirSync(new URL("src/", PACKAGE)).filter(
      (name) =>
        name.endsWith(".ts") &&
        // oxlint-disable-next-line effect/avoid-sync-fs -- see the import
        readFileSync(new URL(`src/${name}`, PACKAGE), "utf8").includes(
          "Generated by `scripts/generate-resources.ts`",
        ),
    );
    expect(generated.sort()).toEqual(RESOURCES.map((resource) => `${resource.subpath}.ts`).sort());
  });
});
