/**
 * The declaration half of #56: a resource module migrated to generated Schema
 * types must not need the `stripe` package to type-check in a consumer.
 *
 * Walks the `.d.ts` graph of `packages/payments-stripe/dist/` from each
 * migrated entry point (following `import … from`, `export … from` and
 * `import("…")` types into the shared declaration chunks) and fails if any
 * declaration reachable from it names `stripe`. Run by this package's `check`
 * task against the fresh `dist/` its build edges produce. Plain Node: nothing
 * here is Effect code.
 *
 * Adding a migrated module to the list below is part of migrating it.
 */

// oxlint-disable-next-line effect/use-filesystem-service -- a build-output check run by bare Node, outside any Effect runtime
import { readFileSync } from "node:fs";

const DIST = new URL("../../../packages/payments-stripe/dist/", import.meta.url);
const SDK = "stripe";

/** The published entry points whose declarations are free of the SDK. */
const MIGRATED = [
  "CheckoutSession.d.ts",
  "BillingPortal.Session.d.ts",
  "Customer.d.ts",
  "Product.d.ts",
  "Price.d.ts",
];

const specifiersIn = (file: string): ReadonlyArray<string> => {
  // oxlint-disable-next-line effect/avoid-sync-fs -- see the import
  const source = readFileSync(new URL(file, DIST), "utf8");
  return [
    ...source.matchAll(/\b(?:from|import)\s*["']([^"']+)["']/g),
    ...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
    ...source.matchAll(/\/\/\/\s*<reference\s+(?:types|path)="([^"]+)"/g),
  ].map((match) => match[1] ?? "");
};

const isSdk = (specifier: string): boolean => specifier === SDK || specifier.startsWith(`${SDK}/`);

/** `./x.js` in a declaration chunk is the `./x.d.ts` beside it. */
const declarationOf = (specifier: string): string => specifier.slice(2).replace(/\.js$/, ".d.ts");

/** Every declaration file reachable from `entry` through local chunks, `entry` included. */
const reachableFrom = (entry: string): ReadonlyArray<string> => {
  const reached = [entry];
  // `reached` grows while it is walked: a worklist.
  for (const file of reached) {
    for (const specifier of specifiersIn(file).filter((item) => item.startsWith("./"))) {
      const next = declarationOf(specifier);
      if (!reached.includes(next)) reached.push(next);
    }
  }
  return reached;
};

const leaks = MIGRATED.flatMap((entry) =>
  reachableFrom(entry)
    .filter((file) => specifiersIn(file).some(isSdk))
    .map((file) => `${entry} -> ${file}`),
);

if (leaks.length > 0) {
  process.stderr.write(`stripe named in migrated declarations: ${leaks.join(", ")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `migrated declarations are free of the stripe SDK: ${MIGRATED.join(", ")}\n`,
  );
}
