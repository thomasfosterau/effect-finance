/**
 * The `.d.ts` graph of `packages/payments-stripe/dist/`, shared by the
 * declaration checks (`declarationsFreeOfSdk.ts`, `distilledDeclarations.ts`):
 * the module specifiers a declaration file names, and every declaration file
 * reachable from an entry point through the local declaration chunks. Plain
 * Node: nothing here is Effect code.
 */

// oxlint-disable-next-line effect/use-filesystem-service -- a build-output check run by bare Node, outside any Effect runtime
import { readFileSync } from "node:fs";

/** The emitted output of the Stripe package. */
export const DIST = new URL("../../../packages/payments-stripe/dist/", import.meta.url);

/** A file of {@link DIST}, as text. */
export const read = (file: string): string =>
  // oxlint-disable-next-line effect/avoid-sync-fs -- see the import
  readFileSync(new URL(file, DIST), "utf8");

/** Every module specifier a declaration file names: imports, re-exports, `import()` types, references. */
export const specifiersIn = (file: string): ReadonlyArray<string> => {
  const source = read(file);
  return [
    ...source.matchAll(/\b(?:from|import)\s*["']([^"']+)["']/g),
    ...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
    ...source.matchAll(/\/\/\/\s*<reference\s+(?:types|path)="([^"]+)"/g),
  ].map((match) => match[1] ?? "");
};

/** `./x.js` in a declaration chunk is the `./x.d.ts` beside it. */
const declarationOf = (specifier: string): string => specifier.slice(2).replace(/\.js$/, ".d.ts");

/** Every declaration file reachable from `entry` through local chunks, `entry` included. */
export const reachableFrom = (entry: string): ReadonlyArray<string> => {
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
