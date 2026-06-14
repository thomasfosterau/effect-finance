import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const coreSrc = fileURLToPath(new URL("./packages/payments/src", import.meta.url));

export default defineConfig({
  resolve: {
    // Resolve the neutral core to its TypeScript source so the suite runs
    // without first building the workspace.
    alias: [
      {
        find: /^@thomasfosterau\/effect-payments$/,
        replacement: `${coreSrc}/index.ts`,
      },
      {
        find: /^@thomasfosterau\/effect-payments\/(.*)$/,
        replacement: `${coreSrc}/$1`,
      },
    ],
  },
  test: {
    globals: true,
    environment: "node",
    include: ["packages/*/src/**/*.test.ts", "packages/*/test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/*.test.ts"],
    },
  },
});
