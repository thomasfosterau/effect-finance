/**
 * Stripe Treasury as one namespace: re-exports the `FinancialAccount`,
 * `Transaction`, `InboundTransfer` and `OutboundTransfer` raw resource modules
 * (each also published on its own `./Treasury.<Name>` subpath). Results are
 * typed with the `stripe` package's declarations and are not decoded.
 *
 * Operations require `StripeHttp`: provide `StripeHttp.layer` (with
 * `FetchHttpClient.layer`) or the SDK transport's `Stripe.layer`.
 *
 * @module
 */

export * as FinancialAccount from "./Treasury.FinancialAccount.js";
export * as Transaction from "./Treasury.Transaction.js";
export * as InboundTransfer from "./Treasury.InboundTransfer.js";
export * as OutboundTransfer from "./Treasury.OutboundTransfer.js";
