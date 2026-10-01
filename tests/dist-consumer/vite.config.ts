import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      // Type-checks the emitted declarations, then asserts that no Stripe
      // entry but `./Stripe` loads the optional `stripe` SDK at runtime
      // (src/sdkOptional.ts) and that the resource modules migrated to
      // generated Schema types (#56) name it in no declaration
      // (src/declarationsFreeOfSdk.ts). Depends on every package's build so
      // `vp run check` at the root always exercises fresh `dist/` output.
      check: {
        command:
          "tsc -p tsconfig.json && node src/sdkOptional.ts && node src/declarationsFreeOfSdk.ts",
        dependsOn: [
          "@thomasfosterau/effect-payments#build",
          "@thomasfosterau/effect-payments-stripe#build",
          "@thomasfosterau/effect-payments-paypal#build",
          "@thomasfosterau/effect-payments-airwallex#build",
        ],
        input: [
          { auto: true },
          "!node_modules/**",
          { pattern: "packages/*/dist/**", base: "workspace" as const },
        ],
        output: [],
      },
    },
  },
});
