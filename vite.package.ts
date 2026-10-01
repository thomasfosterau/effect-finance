/**
 * The one Vite+ configuration every package in this workspace shares: the
 * task graph (`check`, `build`, `test:unit`, `test:coverage`), the `vp pack`
 * (tsdown) settings and the vitest / coverage settings. Each
 * `packages/<name>/vite.config.ts` is a one-call instantiation of it.
 *
 * Adapted from the effect-web library's `vite.package.ts`. The difference is
 * the module layout: these packages keep one flat module per subpath
 * (`src/Customer.ts`, `src/Treasury.FinancialAccount.ts`), so the pack entries
 * are derived from the package's own `exports` map — the manifest stays the
 * single list of public entry points.
 */
import { readFileSync } from "node:fs";
import { defineConfig } from "vite-plus";

/** What differs per package. */
export interface PackageConfigOptions {
  /** The package's `import.meta.url`, so paths resolve relative to it. */
  readonly url: string;
}

/**
 * Input fingerprint for a package's cached tasks: auto tracking minus
 * node_modules bookkeeping churn (pnpm rewrites `.modules.yaml` on every
 * install), with the lockfile back explicitly so a dependency upgrade still
 * invalidates a type-check or a test run.
 */
const cacheInputs = [
  { auto: true },
  "!node_modules/**",
  "!coverage/**",
  { pattern: "!node_modules/**", base: "workspace" as const },
  { pattern: "pnpm-lock.yaml", base: "workspace" as const },
];

/**
 * A sibling package is consumed the way a consumer does — through its
 * `exports`, so its `dist/` — hence the build edge on every task that
 * resolves one. A package with no workspace dependency gets an empty edge.
 */
const siblingBuild = { task: "build", from: "dependencies" as const };

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/**
 * `pack.entry` from the manifest's `exports`: `"."` → `src/index.ts`, and
 * `"./Customer"` → `src/Customer.ts`, emitted as `dist/<key>.js` + `.d.ts`.
 */
const entriesFromExports = (exports: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(
    Object.keys(exports).map((key) => {
      const name = key === "." ? "index" : key.slice(2);
      return [name, `src/${name}.ts`];
    }),
  );

export const packageConfig = ({ url }: PackageConfigOptions) => {
  // SAFETY: every package manifest in this workspace carries `name` and an
  // `exports` map (strict catalog + the release script depend on both).
  const manifest = JSON.parse(readFileSync(new URL("./package.json", url), "utf8")) as {
    readonly name: string;
    readonly exports: Record<string, unknown>;
  };
  const srcDir = new URL("./src/", url).pathname;
  const maxWorkers = process.env.VITEST_MAX_WORKERS;
  return defineConfig({
    run: {
      tasks: {
        // `src` and `tests` under the native, Effect-patched `tsc`.
        check: {
          command: "tsc -p tsconfig.json",
          dependsOn: [siblingBuild],
          input: cacheInputs,
          output: [],
        },
        // The published artifact: one ESM bundle + declaration file per entry
        // point (`vp pack` → tsdown, `platform: neutral`). `sideEffects:
        // false` is a claim about this output: no top-level statements.
        build: {
          command: "vp pack",
          dependsOn: [siblingBuild],
          input: cacheInputs,
          output: ["dist/**"],
        },
        "test:unit": {
          command: "vp test run tests",
          dependsOn: [siblingBuild],
          env: ["VITEST_MAX_WORKERS", "NODE_OPTIONS"],
          input: cacheInputs,
          output: [],
        },
        "test:coverage": {
          command: "vp test run tests --coverage",
          dependsOn: [siblingBuild],
          env: ["VITEST_MAX_WORKERS", "NODE_OPTIONS"],
          input: cacheInputs,
          output: ["coverage/**"],
        },
      },
    },
    pack: {
      entry: entriesFromExports(manifest.exports),
      format: "esm",
      platform: "neutral",
      dts: true,
      outDir: "dist",
      clean: true,
    },
    resolve: {
      // A test that imports its OWN package by name (as a consumer would, and
      // as the `paths` in the package's tsconfig.json type-check it) resolves
      // to `src/` rather than to the `dist/` that `exports` points at, so a
      // unit run never needs this package's build first. Siblings still
      // resolve through `exports` → `dist/` (the `siblingBuild` edge).
      alias: [
        { find: new RegExp(`^${escapeRegExp(manifest.name)}$`), replacement: `${srcDir}index.ts` },
        {
          find: new RegExp(`^${escapeRegExp(manifest.name)}/([A-Za-z.]+)$`),
          replacement: `${srcDir}$1.ts`,
        },
      ],
    },
    test: {
      include: ["tests/**/*.test.ts"],
      testTimeout: 30_000,
      ...(maxWorkers === undefined ? {} : { maxWorkers: Number(maxWorkers) }),
      coverage: {
        provider: "istanbul",
        // `json` writes coverage-final.json, the Istanbul map `fallow audit`
        // reads for exact per-function CRAP scores (`health.coverage` in
        // .fallowrc.json); without it every function scores as uncovered.
        reporter: ["text-summary", "json-summary", "json"],
        reportsDirectory: "./coverage",
        include: ["src/**/*.ts"],
        // `generated/`: machine-written schemas, exercised through the
        // resource modules that decode with them, not line by line.
        exclude: ["**/*.d.ts", "**/generated/**"],
      },
    },
  });
};
