/**
 * The declaration half of the optional `stripe` peer (#56, #146): no Stripe
 * declaration but the webhook verifier's may need the `stripe` package to
 * type-check in a consumer. Every resource module is typed with Distilled's
 * declarations; only `Webhook` (the SDK-based `constructEvent*` and its
 * `StripeService`) names `stripe`, and the root barrel, which re-exports it.
 *
 * Walks the `.d.ts` graph of `packages/payments-stripe/dist/` from every
 * published entry point (following `import … from`, `export … from` and
 * `import("…")` types into the shared declaration chunks) and fails if any
 * declaration reachable from one names `stripe`. Run by this package's
 * `check` task against the fresh `dist/` its build edges produce. Plain Node:
 * nothing here is Effect code.
 */

import { graphOf } from "./declarationGraph.ts";

const SDK = "stripe";

/** The entry points whose declarations may name the SDK: the webhook verifier, and the barrel. */
const NAMES_SDK = new Set(["Webhook.d.ts", "index.d.ts"]);

const isSdk = (specifier: string): boolean => specifier === SDK || specifier.startsWith(`${SDK}/`);

const { entries, reachableFrom, specifiersIn } = graphOf("payments-stripe");

const free = entries().filter((entry) => !NAMES_SDK.has(entry));
const leaks = free.flatMap((entry) =>
  reachableFrom(entry)
    .filter((file) => specifiersIn(file).some(isSdk))
    .map((file) => `${entry} -> ${file}`),
);
// Sanity: the walk sees the SDK where it is named, so it cannot pass vacuously.
const seen = reachableFrom("Webhook.d.ts").some((file) => specifiersIn(file).some(isSdk));

if (leaks.length > 0 || !seen || free.length < 40) {
  if (leaks.length > 0) {
    process.stderr.write(`stripe named in declarations: ${leaks.join(", ")}\n`);
  }
  if (!seen) process.stderr.write("sanity check failed: Webhook.d.ts no longer names stripe\n");
  if (free.length < 40) process.stderr.write(`sanity check failed: only ${free.length} entries\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `declarations are free of the stripe SDK: ${free.length} entries (all but ${[...NAMES_SDK].join(", ")})\n`,
  );
}
