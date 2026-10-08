/**
 * The consumer type-check cost of #146: `@distilled.cloud/stripe` puts every
 * Stripe operation in one generated module whose declaration file is about
 * 7.5 MB, and a consumer whose declarations reach it type-checks all of it.
 * `StripePayments` runs on those operations but names only Distilled's
 * `Credentials` (its own small subpath) in its declarations.
 *
 * Walks the `.d.ts` graph of `packages/payments-stripe/dist/` from every
 * published entry point (following `import … from`, `export … from` and
 * `import("…")` types into the shared declaration chunks) and fails if any
 * declaration reachable from one names a `@distilled.cloud/*` module other
 * than the small subpaths below, which load no generated operation. Run by
 * this package's `check` task against the fresh `dist/` its build edges
 * produce. Plain Node: nothing here is Effect code.
 */

import { reachableFrom, read, specifiersIn } from "./declarationGraph.ts";

const DISTILLED = "@distilled.cloud/";

/** The Distilled subpaths a declaration may name: none loads the generated operations. */
const LIGHT = new Set(["@distilled.cloud/stripe/Credentials"]);

// SAFETY: the package manifest always carries an `exports` map whose entries
// name their declarations (vite.package.ts derives the pack entries from it).
const manifest = JSON.parse(read("../package.json")) as {
  readonly exports: Record<string, { readonly types: string }>;
};
const entries = Object.values(manifest.exports).map((target) =>
  target.types.replace("./dist/", ""),
);

const heavy = entries.flatMap((entry) =>
  reachableFrom(entry).flatMap((file) =>
    specifiersIn(file)
      .filter((specifier) => specifier.startsWith(DISTILLED) && !LIGHT.has(specifier))
      .map((specifier) => `${entry} -> ${file} -> ${specifier}`),
  ),
);
const named = entries.some((entry) =>
  reachableFrom(entry).some((file) => specifiersIn(file).some((item) => LIGHT.has(item))),
);

if (heavy.length > 0 || !named) {
  for (const trail of heavy) process.stderr.write(`heavy Distilled declaration: ${trail}\n`);
  if (!named) {
    process.stderr.write("sanity check failed: no declaration names Distilled's Credentials\n");
  }
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Distilled declarations stay light: ${entries.length} entries name only ${[...LIGHT].join(", ")}\n`,
  );
}
