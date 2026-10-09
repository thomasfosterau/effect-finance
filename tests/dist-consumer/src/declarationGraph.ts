/**
 * The `.d.ts` graph of a package's `dist/`, shared by the declaration checks
 * (`declarationsFreeOfSdk.ts`, `distilledDeclarations.ts`): the module
 * specifiers a declaration file names, and every declaration file reachable
 * from an entry point through the local declaration chunks. Plain Node:
 * nothing here is Effect code.
 */

// oxlint-disable-next-line effect/use-filesystem-service -- a build-output check run by bare Node, outside any Effect runtime
import { readFileSync } from "node:fs";

/** The declaration graph of one package. */
export interface DeclarationGraph {
  /** A file of the package's `dist/`, as text (`../package.json` reads its manifest). */
  readonly read: (file: string) => string;
  /** Every module specifier a declaration file names: imports, re-exports, `import()` types, references. */
  readonly specifiersIn: (file: string) => ReadonlyArray<string>;
  /** Every declaration file reachable from `entry` through local chunks, `entry` included. */
  readonly reachableFrom: (entry: string) => ReadonlyArray<string>;
  /** The declaration file of every entry in the package's `exports`. */
  readonly entries: () => ReadonlyArray<string>;
}

/** `./x.js` in a declaration chunk is the `./x.d.ts` beside it. */
const declarationOf = (specifier: string): string => specifier.slice(2).replace(/\.js$/, ".d.ts");

/** The declaration graph of `packages/<directory>/dist/`. */
export const graphOf = (directory: string): DeclarationGraph => {
  const dist = new URL(`../../../packages/${directory}/dist/`, import.meta.url);
  const read = (file: string): string =>
    // oxlint-disable-next-line effect/avoid-sync-fs -- see the import
    readFileSync(new URL(file, dist), "utf8");
  const specifiersIn = (file: string): ReadonlyArray<string> => {
    const source = read(file);
    return [
      ...source.matchAll(/\b(?:from|import)\s*["']([^"']+)["']/g),
      ...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
      ...source.matchAll(/\/\/\/\s*<reference\s+(?:types|path)="([^"]+)"/g),
    ].map((match) => match[1] ?? "");
  };
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
  const entries = (): ReadonlyArray<string> => {
    // SAFETY: the package manifest always carries an `exports` map whose
    // entries name their declarations (vite.package.ts derives the pack
    // entries from it).
    const manifest = JSON.parse(read("../package.json")) as {
      readonly exports: Record<string, { readonly types: string }>;
    };
    return Object.values(manifest.exports).map((target) => target.types.replace("./dist/", ""));
  };
  return { read, specifiersIn, reachableFrom, entries };
};

/** The declaration graph of `packages/payments-stripe/dist/`. */
export const { reachableFrom, specifiersIn } = graphOf("payments-stripe");
