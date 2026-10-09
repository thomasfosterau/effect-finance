/**
 * The consumer type-check cost of #146: Distilled's generated operation
 * modules are large declaration files (`@distilled.cloud/stripe` puts every
 * Stripe operation in one of about 7.5 MB; `@distilled.cloud/paypal`'s
 * Orders module alone is about 0.8 MB), and a consumer whose declarations
 * reach one type-checks all of it. `StripePayments` and `PayPalPayments` run
 * on those operations but name only Distilled's `Credentials` (each its own
 * small subpath) in their declarations.
 *
 * Walks the `.d.ts` graph of each package's `dist/` from every published
 * entry point (following `import … from`, `export … from` and `import("…")`
 * types into the shared declaration chunks) and fails if any declaration
 * reachable from one names a `@distilled.cloud/*` module other than the small
 * subpath below, which loads no generated operation. Run by this package's
 * `check` task against the fresh `dist/` its build edges produce. Plain Node:
 * nothing here is Effect code.
 */

import { graphOf } from "./declarationGraph.ts";

const DISTILLED = "@distilled.cloud/";

/** Each package on Distilled, and the one Distilled subpath its declarations may name. */
const PACKAGES = [
  { directory: "payments-stripe", light: "@distilled.cloud/stripe/Credentials" },
  { directory: "payments-paypal", light: "@distilled.cloud/paypal/Credentials" },
] as const;

const failures = PACKAGES.flatMap(({ directory, light }) => {
  const { entries, reachableFrom, specifiersIn } = graphOf(directory);
  const heavy = entries().flatMap((entry) =>
    reachableFrom(entry).flatMap((file) =>
      specifiersIn(file)
        .filter((specifier) => specifier.startsWith(DISTILLED) && specifier !== light)
        .map(
          (specifier) =>
            `heavy Distilled declaration: ${directory}: ${entry} -> ${file} -> ${specifier}`,
        ),
    ),
  );
  const named = entries().some((entry) =>
    reachableFrom(entry).some((file) => specifiersIn(file).includes(light)),
  );
  return named
    ? heavy
    : [...heavy, `sanity check failed: no ${directory} declaration names ${light}`];
});

if (failures.length > 0) {
  for (const failure of failures) process.stderr.write(`${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Distilled declarations stay light: ${PACKAGES.map(({ directory, light }) => `${directory} names only ${light}`).join("; ")}\n`,
  );
}
