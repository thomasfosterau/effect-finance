/**
 * The emitted-bundle half of #39's "the `stripe` SDK is optional" guarantee
 * (the source half is `packages/payments-stripe/tests/sdkOptional.test.ts`).
 *
 * Walks the runtime import graph of `packages/payments-stripe/dist/` from
 * every published entry point and fails if any entry can reach `stripe` —
 * through a static `import` / `export … from`, a bare `import "…"`, a dynamic
 * `import("…")` or a `require("…")`, in the entry or in any chunk it pulls in.
 * Since #146 dropped the `./Stripe` SDK transport, no entry loads it: the
 * optional peer only types the SDK-based webhook verifier. A Worker bundle
 * built from any entry therefore never contains the SDK.
 *
 * Run by this package's `check` task after the type check, against the fresh
 * `dist/` its build edges produce. Plain Node: nothing here is Effect code.
 */

// oxlint-disable-next-line effect/use-filesystem-service -- a build-output check run by bare Node, outside any Effect runtime
import { readFileSync } from "node:fs";

const DIST = new URL("../../../packages/payments-stripe/dist/", import.meta.url);
const SDK = "stripe";

/** Every module specifier a bundled file loads at runtime. */
const specifiersOf = (source: string): ReadonlyArray<string> => {
  // Doc comments keep their `@example` imports (`import Stripe from "stripe"`),
  // which load nothing.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return [
    ...code.matchAll(/\b(?:from|import)\s*["']([^"']+)["']/g),
    ...code.matchAll(/\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g),
  ].map((match) => match[1] ?? "");
};

const read = (file: string): string =>
  // oxlint-disable-next-line effect/avoid-sync-fs -- see the import
  readFileSync(new URL(file, DIST), "utf8");

const isSdk = (specifier: string): boolean => specifier === SDK || specifier.startsWith(`${SDK}/`);

/** The path from `entry` through local chunks to a module `isTarget` names, if there is one. */
const pathTo = (
  entry: string,
  isTarget: (specifier: string) => boolean,
): ReadonlyArray<string> | undefined => {
  const seen = new Set<string>();
  const step = (specifier: string, trail: ReadonlyArray<string>) => {
    if (isTarget(specifier)) return [...trail, specifier];
    return specifier.startsWith("./")
      ? walk(specifier.slice(2), [...trail, specifier.slice(2)])
      : undefined;
  };
  const walk = (file: string, trail: ReadonlyArray<string>): ReadonlyArray<string> | undefined => {
    if (seen.has(file)) return undefined;
    seen.add(file);
    for (const specifier of specifiersOf(read(file))) {
      const found = step(specifier, trail);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  return walk(entry, [entry]);
};

/** The path from `entry` to the SDK, if there is one. */
const pathToSdk = (entry: string) => pathTo(entry, isSdk);

/** The path from `entry` to Distilled's Stripe operations, if there is one. */
const pathToDistilled = (entry: string) =>
  pathTo(entry, (specifier) => specifier === "@distilled.cloud/stripe/stripe");

// SAFETY: the package manifest always carries an `exports` map (vite.package.ts
// derives the pack entries from it).
const manifest = JSON.parse(
  // oxlint-disable-next-line effect/avoid-sync-fs -- see the import
  readFileSync(new URL("../package.json", DIST), "utf8"),
) as { readonly exports: Record<string, { readonly default: string }> };

const entries = Object.values(manifest.exports).map((target) =>
  target.default.replace("./dist/", ""),
);
const leaks = entries.map((entry) => pathToSdk(entry)).filter((trail) => trail !== undefined);
// Sanity: the walk follows chunks, so it must reach Distilled's operations
// from a resource module; a walker that found nothing would pass vacuously.
const walks = pathToDistilled("Customer.js") !== undefined;

if (leaks.length > 0 || !walks || entries.length < 2) {
  for (const trail of leaks) {
    process.stderr.write(`stripe reachable at runtime: ${trail.join(" -> ")}\n`);
  }
  if (!walks)
    process.stderr.write("sanity check failed: Customer.js reaches no Distilled module\n");
  process.exitCode = 1;
} else {
  process.stdout.write(`stripe SDK optional: none of ${entries.length} entries loads it\n`);
}
