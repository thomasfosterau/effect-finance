/**
 * The Stripe API version the capability layers follow, in a module of its own
 * so that `StripePayments` re-exports it without its declarations reaching
 * the Distilled client's.
 *
 * @module
 */

/**
 * The Stripe API version every capability layer pins in `Stripe-Version`
 * unless configured: the one the pinned `@distilled.cloud/stripe` release's
 * schemas are generated from (`2026-07-29.dahlia` for `1.0.0-rc.13`). It moves
 * whenever this package moves its Distilled pin, so create the webhook
 * endpoints whose events a program reads beside the capabilities at this
 * version. The raw resource modules and `StripeHttp` pin `DEFAULT_API_VERSION`
 * instead, until they are re-exports of Distilled (#146).
 *
 * Where it comes from (owner decision on #146: follow Distilled): the
 * `version` of the `com.stripe.api#Stripe` service in
 * `packages/stripe/.generated-specs/stripe.json` at alchemy-run/distilled's
 * release commit (`e02e9d40` for `1.0.0-rc.13`); the package exposes no such
 * constant. `tests/distilledApiVersion.test.ts` keys it by the installed
 * Distilled version and fails on a release it does not list, so a Distilled
 * bump updates this constant and that table together.
 */
export const DISTILLED_API_VERSION = "2026-07-29.dahlia";
