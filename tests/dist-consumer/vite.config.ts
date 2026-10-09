import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      // Type-checks the emitted declarations, then asserts that no Stripe
      // entry but `./Stripe` loads the optional `stripe` SDK at runtime
      // (src/sdkOptional.ts) and that the resource modules migrated to
      // generated Schema types (#56) name it in no declaration
      // (src/declarationsFreeOfSdk.ts), and that no Stripe or PayPal
      // declaration reaches Distilled's generated operations
      // (src/distilledDeclarations.ts, #146). Depends on every package's build so
      // `vp run check` at the root always exercises fresh `dist/` output.
      check: {
        command:
          "tsc -p tsconfig.json && node src/sdkOptional.ts && node src/declarationsFreeOfSdk.ts && node src/distilledDeclarations.ts",
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
