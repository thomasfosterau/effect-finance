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

import { reachableFrom, specifiersIn } from "./declarationGraph.ts";

const SDK = "stripe";

/** The published entry points whose declarations are free of the SDK. */
const MIGRATED = [
  "CheckoutSession.d.ts",
  "BillingPortal.Session.d.ts",
  "Customer.d.ts",
  "Product.d.ts",
  "Price.d.ts",
  "Subscription.d.ts",
  "SubscriptionSchedule.d.ts",
  "Invoice.d.ts",
];

const isSdk = (specifier: string): boolean => specifier === SDK || specifier.startsWith(`${SDK}/`);

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
