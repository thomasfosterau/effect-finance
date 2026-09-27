import { describe, it, expect } from "vite-plus/test";
// oxlint-disable-next-line effect/use-filesystem-service -- a test inspecting the package's own source files, outside any Effect runtime
import { readdirSync, readFileSync } from "node:fs";

/**
 * `stripe` is an optional peer (#39): only the SDK transport (`src/Stripe.ts`)
 * may load it at runtime. Everything else — the barrel, the fetch transport,
 * the capability layers, every resource module — may use its types only, so a
 * Worker bundle built from them never contains the SDK. This walks the
 * runtime import graph of the sources and fails on any path to `stripe`.
 */

const SRC = new URL("../src/", import.meta.url);

/** The modules a source file imports at runtime (`import type` excluded). */
const runtimeImportsOf = (source: string): ReadonlyArray<string> => {
  const found: Array<string> = [];
  const statement =
    /^(?:import|export)\s+(type\s+)?([^"';]*?)\s*from\s+"([^"]+)";|^import\s+"([^"]+)";/gms;
  for (const match of source.matchAll(statement)) {
    const [, typeOnly, clause = "", from, bare] = match;
    if (bare !== undefined) {
      found.push(bare);
      continue;
    }
    if (typeOnly !== undefined || from === undefined) continue;
    // `import { type A, type B } from …` is erased too.
    const named = /^\{([^}]*)\}$/s.exec(clause.trim());
    if (named !== null) {
      const specifiers = named[1]!
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");
      if (specifiers.every((item) => item.startsWith("type "))) continue;
    }
    found.push(from);
  }
  return found;
};

/** `./x.js` relative to `file` → the source path under `src/`, or the package name. */
const resolve = (file: string, specifier: string): string => {
  if (!specifier.startsWith(".")) return specifier;
  const url = new URL(specifier.replace(/\.js$/, ".ts"), new URL(file, SRC));
  return url.pathname.slice(SRC.pathname.length);
};

const reaches = (entry: string, target: string): ReadonlyArray<string> | undefined => {
  const seen = new Set<string>();
  const walk = (file: string, trail: ReadonlyArray<string>): ReadonlyArray<string> | undefined => {
    if (file === target) return trail;
    if (seen.has(file) || !file.endsWith(".ts")) return undefined;
    seen.add(file);
    // oxlint-disable-next-line effect/avoid-sync-fs -- see the import
    const source = readFileSync(new URL(file, SRC), "utf8");
    for (const specifier of runtimeImportsOf(source)) {
      const next = resolve(file, specifier);
      const path = walk(next, [...trail, next]);
      if (path !== undefined) return path;
    }
    return undefined;
  };
  return walk(entry, [entry]);
};

// oxlint-disable-next-line effect/avoid-sync-fs -- see the import
const entries = readdirSync(SRC).filter((name) => name.endsWith(".ts"));

describe("the stripe SDK is optional", () => {
  it("finds the entry points", () => {
    expect(entries).toContain("index.ts");
    expect(entries).toContain("StripeHttp.ts");
    expect(entries).toContain("Stripe.ts");
  });

  it("is loaded by the SDK transport", () => {
    expect(reaches("Stripe.ts", "stripe")).toBeDefined();
  });

  it.each(entries.filter((name) => name !== "Stripe.ts"))(
    "is never loaded at runtime from %s",
    (entry) => {
      expect(reaches(entry, "stripe")).toBeUndefined();
    },
  );
});
