/**
 * Which `@distilled.cloud/stripe` operation each resource module exposes,
 * under which name, and the source of every generated resource module.
 *
 * Every operation Distilled generates is either **assigned** to one published
 * resource subpath (`./Customer`, `./Invoice`, `./Treasury.FinancialAccount`,
 * …) by the longest API path in {@link RESOURCES} it falls under (its test
 * helpers, `/v1/test_helpers/…`, included), or listed in {@link UNEXPOSED}
 * because no subpath holds its resource yet. `tests/resources.test.ts` fails
 * on an operation that is neither, so a Distilled bump that adds one forces a
 * decision; it also fails when a generated module on disk differs from
 * {@link render}'s output (run `generate:resources`).
 *
 * Names follow the path, after the matched prefix (`{id}` is a path id):
 *
 * | rest of the path | `GET` | `POST` | `DELETE` |
 * | --- | --- | --- | --- |
 * | (none) | `list` (a list) / `retrieve` | `create` | `del` |
 * | `{id}` | `retrieve` | `update` | `del` |
 * | `word` | `word` | `word` | — |
 * | `{id}/word` | `listWord` (a list) / `retrieveWord` | `createWord` (a collection) / `updateWord` (an object) / `word` (an action) | `delWord` |
 * | `{id}/words/{id}` | `retrieveWord` | `updateWord` | `delWord` |
 * | `{id}/words/{id}/act` | — | `actWord` | — |
 *
 * in camel case, singular after `list` / `create` / … of a collection; a test
 * helper is `testHelpers` + the name. {@link OVERRIDES} keeps the name an
 * operation had before the resource modules re-exported Distilled
 * (`Subscription.cancel`, `Treasury.FinancialAccount.retrieveFeatures`) and
 * settles the few the rule cannot (`Invoice.voidInvoice`: `void` is reserved).
 *
 * The test imports it, and the generator script (`generate-resources.ts`)
 * runs it under Node.
 *
 * @module
 */

import { Effect, Schema } from "effect";
import type * as AST from "effect/SchemaAST";
import { getAnn, getProps, hasPropAnn, nameOf } from "@distilled.cloud/core/protocol-http";
import { httpSymbol, labelSymbol } from "@distilled.cloud/core/trait";
import { format } from "vite-plus/fmt";

/** One published resource subpath and the API paths whose operations it holds. */
export interface Resource {
  /** The subpath, published as `./<subpath>` from `src/<subpath>.ts`. */
  readonly subpath: string;
  /** API path templates (`/v1/customers`); an operation under several goes to the longest. */
  readonly paths: ReadonlyArray<string>;
}

/** Every resource subpath this package publishes. */
export const RESOURCES: ReadonlyArray<Resource> = [
  { subpath: "Account", paths: ["/v1/accounts"] },
  { subpath: "AccountLink", paths: ["/v1/account_links"] },
  { subpath: "Balance", paths: ["/v1/balance"] },
  { subpath: "BalanceTransaction", paths: ["/v1/balance_transactions"] },
  { subpath: "BillingPortal.Session", paths: ["/v1/billing_portal/sessions"] },
  { subpath: "Charge", paths: ["/v1/charges"] },
  { subpath: "CheckoutSession", paths: ["/v1/checkout/sessions"] },
  { subpath: "CountrySpec", paths: ["/v1/country_specs"] },
  { subpath: "Coupon", paths: ["/v1/coupons"] },
  { subpath: "Customer", paths: ["/v1/customers"] },
  { subpath: "Dispute", paths: ["/v1/disputes"] },
  { subpath: "Event", paths: ["/v1/events"] },
  { subpath: "ExternalAccount", paths: ["/v1/accounts/{account}/external_accounts"] },
  { subpath: "File", paths: ["/v1/files"] },
  { subpath: "Identity.VerificationReport", paths: ["/v1/identity/verification_reports"] },
  { subpath: "Identity.VerificationSession", paths: ["/v1/identity/verification_sessions"] },
  { subpath: "Invoice", paths: ["/v1/invoices"] },
  { subpath: "Issuing.Authorization", paths: ["/v1/issuing/authorizations"] },
  { subpath: "Issuing.Card", paths: ["/v1/issuing/cards"] },
  { subpath: "Issuing.Cardholder", paths: ["/v1/issuing/cardholders"] },
  { subpath: "Issuing.Dispute", paths: ["/v1/issuing/disputes"] },
  { subpath: "Issuing.Transaction", paths: ["/v1/issuing/transactions"] },
  { subpath: "PaymentIntent", paths: ["/v1/payment_intents"] },
  { subpath: "PaymentMethod", paths: ["/v1/payment_methods"] },
  { subpath: "Payout", paths: ["/v1/payouts"] },
  { subpath: "Person", paths: ["/v1/accounts/{account}/persons"] },
  { subpath: "Price", paths: ["/v1/prices"] },
  { subpath: "Product", paths: ["/v1/products"] },
  { subpath: "PromotionCode", paths: ["/v1/promotion_codes"] },
  { subpath: "Refund", paths: ["/v1/refunds"] },
  { subpath: "Review", paths: ["/v1/reviews"] },
  { subpath: "SetupIntent", paths: ["/v1/setup_intents"] },
  { subpath: "Subscription", paths: ["/v1/subscriptions"] },
  { subpath: "SubscriptionSchedule", paths: ["/v1/subscription_schedules"] },
  { subpath: "TaxRate", paths: ["/v1/tax_rates"] },
  { subpath: "Terminal.ConnectionToken", paths: ["/v1/terminal/connection_tokens"] },
  { subpath: "Terminal.Location", paths: ["/v1/terminal/locations"] },
  { subpath: "Terminal.Reader", paths: ["/v1/terminal/readers"] },
  { subpath: "Topup", paths: ["/v1/topups"] },
  { subpath: "Transfer", paths: ["/v1/transfers"] },
  { subpath: "Treasury.FinancialAccount", paths: ["/v1/treasury/financial_accounts"] },
  { subpath: "Treasury.InboundTransfer", paths: ["/v1/treasury/inbound_transfers"] },
  { subpath: "Treasury.OutboundTransfer", paths: ["/v1/treasury/outbound_transfers"] },
  { subpath: "Treasury.Transaction", paths: ["/v1/treasury/transactions"] },
  { subpath: "WebhookEndpoint", paths: ["/v1/webhook_endpoints"] },
];

/**
 * API paths whose operations no subpath exposes yet: resources this package
 * has never published a module for. A program reaches them through
 * `@distilled.cloud/stripe` directly. Each entry must still match an
 * operation, so one Distilled drops is removed here too.
 */
export const UNEXPOSED: ReadonlyArray<string> = [
  "/v1/account_sessions",
  "/v1/apple_pay/domains",
  "/v1/application_fees",
  "/v1/apps/secrets",
  "/v1/balance_settings",
  "/v1/billing/alerts",
  "/v1/billing/credit_balance_summary",
  "/v1/billing/credit_balance_transactions",
  "/v1/billing/credit_grants",
  "/v1/billing/meter_event_adjustments",
  "/v1/billing/meter_events",
  "/v1/billing/meters",
  "/v1/billing_portal/configurations",
  "/v1/climate/orders",
  "/v1/climate/products",
  "/v1/climate/suppliers",
  "/v1/confirmation_tokens",
  "/v1/credit_notes",
  "/v1/customer_sessions",
  "/v1/entitlements/active_entitlements",
  "/v1/entitlements/features",
  "/v1/ephemeral_keys",
  "/v1/exchange_rates",
  "/v1/file_links",
  "/v1/financial_connections/accounts",
  "/v1/financial_connections/sessions",
  "/v1/financial_connections/transactions",
  "/v1/forwarding/requests",
  "/v1/invoice_payments",
  "/v1/invoice_rendering_templates",
  "/v1/invoiceitems",
  "/v1/issuing/personalization_designs",
  "/v1/issuing/physical_bundles",
  "/v1/issuing/tokens",
  "/v1/mandates",
  "/v1/payment_attempt_records",
  "/v1/payment_links",
  "/v1/payment_method_configurations",
  "/v1/payment_method_domains",
  "/v1/payment_records",
  "/v1/plans",
  "/v1/quotes",
  "/v1/radar/early_fraud_warnings",
  "/v1/radar/payment_evaluations",
  "/v1/radar/value_list_items",
  "/v1/radar/value_lists",
  "/v1/reporting/report_runs",
  "/v1/reporting/report_types",
  "/v1/setup_attempts",
  "/v1/shipping_rates",
  "/v1/sigma/scheduled_query_runs",
  "/v1/sources",
  "/v1/subscription_items",
  "/v1/tax/associations",
  "/v1/tax/calculations",
  "/v1/tax/registrations",
  "/v1/tax/settings",
  "/v1/tax/transactions",
  "/v1/tax_codes",
  "/v1/tax_ids",
  "/v1/terminal/configurations",
  "/v1/terminal/onboarding_links",
  "/v1/test_helpers/confirmation_tokens",
  "/v1/test_helpers/test_clocks",
  "/v1/tokens",
  "/v1/treasury/credit_reversals",
  "/v1/treasury/debit_reversals",
  "/v1/treasury/outbound_payments",
  "/v1/treasury/received_credits",
  "/v1/treasury/received_debits",
  "/v1/treasury/transaction_entries",
  "/v2",
];

/** An operation the naming rule does not place or name as it should. */
interface Override {
  /** The subpath, when the operation's path is under none of its {@link Resource.paths}. */
  readonly subpath?: string | undefined;
  /** The name, when the rule's is not the one to publish. */
  readonly name?: string | undefined;
}

/** Overrides by Distilled operation name. */
type Overrides = Readonly<Record<string, Override>>;

/** The operations, by Distilled name, the rule does not place or name. */
export const OVERRIDES = {
  // `GET /v1/account`: the account the key belongs to, beside `retrieve(id)`.
  GetAccount: { subpath: "Account", name: "retrieveCurrent" },
  // `POST …/login_links` and `…/funding_instructions` create, but there is no
  // collection to list.
  CreateAccountLoginLink: { name: "createLoginLink" },
  CreateCustomerFundingInstruction: { name: "createFundingInstructions" },
  // `void` is a reserved word.
  CreateInvoiceVoid: { name: "voidInvoice" },
  // `DELETE /v1/subscriptions/{id}` cancels; the module has always called it `cancel`.
  DeleteSubscription: { name: "cancel" },
} satisfies Overrides;

/** The override of the operation Distilled names `name`, if there is one. */
const overrideOf = (name: string, overrides: Overrides = OVERRIDES): Override | undefined =>
  overrides[name];

/** One Distilled operation, as the planner reads it. */
export interface DistilledOperation {
  /** Distilled's export name (`CreateCustomer`). */
  readonly name: string;
  /** Its input and output type (and schema) names in `@distilled.cloud/stripe/stripe`. */
  readonly input: string;
  readonly output: string;
  readonly method: "GET" | "POST" | "DELETE";
  /** The path template (`/v1/customers/{customer}`). */
  readonly path: string;
  /** The input members bound to path ids, in path order. */
  readonly ids: ReadonlyArray<string>;
  /** Whether the input has members beyond the path ids, and whether any is required. */
  readonly params: "none" | "optional" | "required";
  /** Whether the output is a page (`{ data, has_more }`). */
  readonly list: boolean;
  /** Whether the body is `multipart/form-data` (the Files API). */
  readonly upload: boolean;
  /** Distilled's one-line summary (`Create a customer`), or `""`. */
  readonly summary: string;
}

/** An operation placed in a resource module. */
export interface Planned extends DistilledOperation {
  /** The exported function name. */
  readonly exported: string;
}

/** What {@link plan} decides. */
export interface Plan {
  /** Each resource subpath's operations, sorted by exported name. */
  readonly modules: ReadonlyMap<string, ReadonlyArray<Planned>>;
  /** The operations left unexposed, by Distilled name. */
  readonly unexposed: ReadonlyArray<string>;
  /** Every problem: an operation unassigned, a name clash, an unused table entry. */
  readonly problems: ReadonlyArray<string>;
}

const RESERVED = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

const TEST_HELPERS = "/v1/test_helpers";

/** `/v1/x` → `/v1/test_helpers/x`. */
const testHelperPath = (path: string): string => `${TEST_HELPERS}${path.slice("/v1".length)}`;

/** The path segments of `path` after `prefix`, if `path` is `prefix` or under it. */
const restOf = (path: string, prefix: string): ReadonlyArray<string> | undefined =>
  path === prefix
    ? []
    : path.startsWith(`${prefix}/`)
      ? path.slice(prefix.length + 1).split("/")
      : undefined;

const isId = (segment: string): boolean => segment.startsWith("{");

const pascal = (segment: string): string =>
  segment
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join("");

const camel = (segment: string): string => {
  const name = pascal(segment);
  return `${name.charAt(0).toLowerCase()}${name.slice(1)}`;
};

const singular = (segment: string): string =>
  segment.endsWith("ies")
    ? `${segment.slice(0, -3)}y`
    : segment.endsWith("s")
      ? segment.slice(0, -1)
      : segment;

/** Where an operation goes: a resource module, under the rest of its path, or nowhere. */
type Placement =
  | {
      readonly kind: "resource";
      readonly subpath: string;
      readonly rest: ReadonlyArray<string>;
      readonly testHelper: boolean;
    }
  | { readonly kind: "unexposed" }
  | { readonly kind: "unassigned" };

/** The longest of `prefixes` an operation's path falls under, directly or as a test helper. */
const longestMatch = (
  path: string,
  prefixes: ReadonlyArray<string>,
): { readonly prefix: string; rest: ReadonlyArray<string>; testHelper: boolean } | undefined =>
  prefixes
    .flatMap((prefix) => {
      const direct = restOf(path, prefix);
      const helper = prefix.startsWith("/v1/") ? restOf(path, testHelperPath(prefix)) : undefined;
      return [
        ...(direct === undefined ? [] : [{ prefix, rest: direct, testHelper: false }]),
        ...(helper === undefined ? [] : [{ prefix, rest: helper, testHelper: true }]),
      ];
    })
    .reduce<
      { readonly prefix: string; rest: ReadonlyArray<string>; testHelper: boolean } | undefined
    >(
      (best, match) =>
        best === undefined || match.prefix.length > best.prefix.length ? match : best,
      undefined,
    );

const place = (operation: DistilledOperation): Placement => {
  const override = overrideOf(operation.name)?.subpath;
  if (override !== undefined) {
    return { kind: "resource", subpath: override, rest: [], testHelper: false };
  }
  const match = RESOURCES.flatMap((resource) => {
    const found = longestMatch(operation.path, resource.paths);
    return found === undefined ? [] : [{ ...found, subpath: resource.subpath }];
  }).reduce<
    | { readonly prefix: string; subpath: string; rest: ReadonlyArray<string>; testHelper: boolean }
    | undefined
  >(
    (best, found) =>
      best === undefined || found.prefix.length > best.prefix.length ? found : best,
    undefined,
  );
  if (match !== undefined) {
    return {
      kind: "resource",
      subpath: match.subpath,
      rest: match.rest,
      testHelper: match.testHelper,
    };
  }
  return longestMatch(operation.path, UNEXPOSED) === undefined
    ? { kind: "unassigned" }
    : { kind: "unexposed" };
};

/** What naming an operation reads: the operation, the words of the rest of its path, every operation. */
interface Naming {
  readonly operation: DistilledOperation;
  readonly words: ReadonlyArray<string>;
  readonly all: ReadonlyArray<DistilledOperation>;
}

type Method = DistilledOperation["method"];

/** The verb of each method on an object: `{id}`, or `{id}/words/{id}`. */
const OBJECT_VERB: Readonly<Record<Method, string>> = {
  GET: "retrieve",
  POST: "update",
  DELETE: "del",
};

/** `GET` of a page lists; of anything else, retrieves. */
const readVerb = (operation: DistilledOperation): string => (operation.list ? "list" : "retrieve");

/** The resource's own path: a `GET` reads it, a `POST` creates under it, a `DELETE` deletes it. */
const nameRoot = ({ operation }: Naming): string =>
  operation.method === "GET" ? readVerb(operation) : operation.method === "POST" ? "create" : "del";

/**
 * A `POST` to `{id}/word`: a create in a collection (one with a list or an
 * `{id}/word/{id}` beside it), an update of a sub-object Stripe also reads
 * (`{id}/features`), or else an action named by the word.
 */
const namePostUnder = ({ operation, words, all }: Naming): string => {
  const word = words[0] ?? "";
  const read = all.find((other) => other.path === operation.path && other.method === "GET");
  const collection =
    read?.list === true || all.some((other) => other.path.startsWith(`${operation.path}/{`));
  if (collection) return `create${pascal(singular(word))}`;
  return read === undefined ? camel(word) : `update${pascal(word)}`;
};

/** An operation on `{id}/word`. */
const nameUnder = (naming: Naming): string => {
  const word = pascal(naming.words[0] ?? "");
  const { operation } = naming;
  if (operation.method === "GET") return `${readVerb(operation)}${word}`;
  return operation.method === "DELETE" ? `del${word}` : namePostUnder(naming);
};

/** Names an operation. */
type Namer = (naming: Naming) => string;

/** Namers by the shape of the rest of the path. */
type Namers = Readonly<Record<string, Namer>>;

/** The rule for each shape of the rest of the path (`{}` an id, `w` a word). */
const NAMERS = {
  "": nameRoot,
  "{}": ({ operation }) => OBJECT_VERB[operation.method],
  w: ({ words }) => camel(words[0] ?? ""),
  "{}/w": nameUnder,
  "{}/w/{}": ({ operation, words }) =>
    `${OBJECT_VERB[operation.method]}${pascal(singular(words[0] ?? ""))}`,
  "{}/w/{}/w": ({ words }) => `${camel(words[1] ?? "")}${pascal(singular(words[0] ?? ""))}`,
} satisfies Namers;

/** The rule for a shape, if it has one. */
const namerOf = (pattern: string, namers: Namers = NAMERS): Namer | undefined => namers[pattern];

/** The rule's name for an operation, from the rest of its path. */
const ruleName = (
  operation: DistilledOperation,
  rest: ReadonlyArray<string>,
  all: ReadonlyArray<DistilledOperation>,
): string => {
  const words = rest.filter((segment) => !isId(segment));
  const pattern = rest.map((segment) => (isId(segment) ? "{}" : "w")).join("/");
  const namer = namerOf(pattern) ?? (() => camel(words.join("_")));
  return namer({ operation, words, all });
};

/** The exported name of an operation placed in a module. */
const exportedName = (
  operation: DistilledOperation,
  placement: Extract<Placement, { readonly kind: "resource" }>,
  all: ReadonlyArray<DistilledOperation>,
): string => {
  const base = overrideOf(operation.name)?.name ?? ruleName(operation, placement.rest, all);
  return placement.testHelper ? `testHelpers${pascal(base)}` : base;
};

/** Why `exported` cannot join `module`, if it cannot. */
const nameProblems = (
  operation: DistilledOperation,
  exported: string,
  subpath: string,
  module: ReadonlyArray<Planned>,
): ReadonlyArray<string> => {
  const clash = module.find((other) => other.exported === exported);
  return [
    ...(RESERVED.has(exported)
      ? [`${operation.name} would be exported as the reserved word ${exported}`]
      : []),
    ...(clash === undefined
      ? []
      : [`${operation.name} and ${clash.name} would both be ${subpath}.${exported}`]),
  ];
};

/** The table entries that name nothing Distilled has. */
const staleEntries = (operations: ReadonlyArray<DistilledOperation>): ReadonlyArray<string> => {
  const known = new Set(operations.map((operation) => operation.name));
  return [
    ...Object.keys(OVERRIDES)
      .filter((name) => !known.has(name))
      .map((name) => `OVERRIDES names ${name}, which Distilled no longer has`),
    ...UNEXPOSED.filter(
      (prefix) => !operations.some((operation) => longestMatch(operation.path, [prefix])),
    ).map((prefix) => `UNEXPOSED lists ${prefix}, which no operation is under`),
  ];
};

/** Decide every operation's module and name. */
export const plan = (operations: ReadonlyArray<DistilledOperation>): Plan => {
  const modules = new Map<string, Array<Planned>>(
    RESOURCES.map((resource) => [resource.subpath, []]),
  );
  const unexposed: Array<string> = [];
  const problems: Array<string> = [...staleEntries(operations)];
  for (const operation of operations) {
    const placement = place(operation);
    if (placement.kind !== "resource") {
      if (placement.kind === "unexposed") unexposed.push(operation.name);
      else {
        problems.push(
          `${operation.name} (${operation.method} ${operation.path}) is in no resource module and not listed as unexposed`,
        );
      }
      continue;
    }
    const module = modules.get(placement.subpath);
    if (module === undefined) {
      problems.push(
        `${operation.name} is overridden into ${placement.subpath}, which is no resource`,
      );
      continue;
    }
    const exported = exportedName(operation, placement, operations);
    problems.push(...nameProblems(operation, exported, placement.subpath, module));
    module.push({ ...operation, exported });
  }
  for (const [subpath, planned] of modules) {
    if (planned.length === 0) problems.push(`${subpath} would export no operation`);
    planned.sort((a, b) => a.exported.localeCompare(b.exported));
  }
  return { modules, unexposed, problems };
};

// ---------------------------------------------------------------------------
// Reading Distilled
// ---------------------------------------------------------------------------

/** A schema, as Distilled's operations expose theirs (`.input` / `.output`). */
interface WithAst {
  readonly ast: AST.AST;
}

const OPERATION =
  /(?:\/\*\*(?<doc>[^\n]*?)\*\/\n)?export declare const (?<name>\w+): API\.(?:Paginated)?OperationMethod<(?<input>\w+), (?<output>\w+), \w+, StripeOpContext(?:, \w+)?>;/g;

/**
 * The names of every operation the Distilled module exports at runtime (a
 * function carrying its schemas as `.input`), so a declaration the reader's
 * pattern misses cannot drop an operation silently.
 */
export const runtimeOperations = (
  distilled: Readonly<Record<string, unknown>>,
): ReadonlyArray<string> =>
  Object.keys(distilled)
    .filter((name) => {
      const value = distilled[name];
      return (
        typeof value === "function" &&
        Object.getOwnPropertyDescriptor(value, "input")?.get !== undefined
      );
    })
    .sort();

const summaryOf = (doc: string): string =>
  doc
    .trim()
    .split(" <p>")[0]
    ?.replace(/<[^>]+>/g, "")
    .trim() ?? "";

/**
 * Every operation of `@distilled.cloud/stripe/stripe`: names and docs from its
 * declarations (`lib/services/stripe.d.ts`), method, path and members from
 * the operations' own schemas (`distilled`, the module itself).
 */
export const readOperations = (
  declarations: string,
  distilled: Readonly<Record<string, unknown>>,
): ReadonlyArray<DistilledOperation> =>
  [...declarations.matchAll(OPERATION)].map((match) => {
    const { doc = "", name = "", input = "", output = "" } = match.groups ?? {};
    // SAFETY: every `API.OperationMethod` Distilled exports carries its
    // schemas as `.input` / `.output` (`@distilled.cloud/core/api`'s `make`).
    const operation = distilled[name] as { readonly input: WithAst; readonly output: WithAst };
    const inputAst = operation.input.ast;
    // SAFETY: every generated input carries the `Http()` trait.
    const http = getAnn(inputAst, httpSymbol) as {
      readonly method: DistilledOperation["method"];
      readonly uri: string;
      readonly contentType?: string | undefined;
    };
    const props = getProps(inputAst);
    const labels = props.filter((prop) => hasPropAnn(prop, labelSymbol));
    const tokens = labels.map((prop) => ({
      member: String(prop.name),
      at: http.uri.indexOf(`{${nameOf(prop, labelSymbol)}}`),
    }));
    const others = props.filter((prop) => !labels.includes(prop));
    const outputNames = getProps(operation.output.ast).map((prop) => String(prop.name));
    return {
      name,
      input,
      output,
      method: http.method,
      path: http.uri,
      ids: tokens.sort((a, b) => a.at - b.at).map((token) => token.member),
      params:
        others.length === 0
          ? "none"
          : others.some((prop) => prop.type.context?.isOptional !== true)
            ? "required"
            : "optional",
      list: outputNames.includes("data") && outputNames.includes("has_more"),
      upload: http.contentType === "multipart",
      summary: summaryOf(doc),
    };
  });

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** A doc comment's text, safe inside `/** … *\/`. */
const docText = (text: string): string => text.replaceAll("*/", "*\\/");

/**
 * A type Distilled names in an operation's declaration: one of its own, or a
 * keyword (`unknown`: rc.13 declares `CreateTransfer` / `GetTransfer` /
 * `UpdateTransfer` so).
 */
const KEYWORDS = new Set(["unknown"]);

const typeOf = (name: string): string => (KEYWORDS.has(name) ? name : `Distilled.${name}`);

const signatureOf = (operation: Planned): string => {
  const ids = operation.ids.map((id) => `${id}: string`);
  const rest =
    operation.ids.length === 0
      ? `Distilled.${operation.input}`
      : `Omit<Distilled.${operation.input}, ${operation.ids.map((id) => JSON.stringify(id)).join(" | ")}>`;
  const params =
    operation.params === "none"
      ? []
      : operation.params === "required"
        ? [`params: ${rest}`]
        : [`params?: ${rest} | undefined`];
  return `(${[...ids, ...params, "options?: RequestOptions | undefined"].join(", ")}) => Effect.Effect<${typeOf(operation.output)}, PaymentsError, StripeHttp>`;
};

const renderOperation = (operation: Planned): string => {
  const summary = operation.summary === "" ? operation.name : operation.summary;
  const route = [
    `method: ${JSON.stringify(operation.method)}`,
    `path: ${JSON.stringify(operation.path)}`,
    `ids: [${operation.ids.map((id) => JSON.stringify(id)).join(", ")}]`,
    `params: ${operation.params !== "none"}`,
    ...(operation.upload ? ["upload: true"] : []),
  ].join(", ");
  return [
    "/**",
    ` * ${docText(summary)} (\`${operation.method} ${operation.path}\`): Distilled's`,
    ` * \`${operation.name}\`.`,
    " */",
    `export const ${operation.exported}: ${signatureOf(operation)} = /* @__PURE__ */ operation(Distilled.${operation.name}, { ${route} });`,
  ].join("\n");
};

/** The module doc's first line: the API paths the module holds. */
const pathsOf = (subpath: string): string =>
  (RESOURCES.find((resource) => resource.subpath === subpath)?.paths ?? [])
    .map((path) => `\`${path}\``)
    .join(", ");

/** One resource module's source, unformatted. */
const renderModule = (
  subpath: string,
  operations: ReadonlyArray<Planned>,
  version: string,
): string => {
  const types = [...new Set(operations.flatMap((operation) => [operation.input, operation.output]))]
    .filter((name) => !KEYWORDS.has(name))
    .sort();
  return [
    "/**",
    ` * Stripe's ${pathsOf(subpath)} API as a raw resource module, the escape hatch for`,
    " * what the neutral capabilities do not cover: every `@distilled.cloud/stripe`",
    " * operation on the resource, its test helpers included.",
    " *",
    " * Each operation takes the resource's path ids first, then the rest of",
    " * Distilled's input (`params`), then {@link RequestOptions}, and runs through",
    " * the `StripeHttp` client in context: `Stripe-Version` pinned to",
    " * `DISTILLED_API_VERSION` (unless configured, or overridden per call), the",
    " * SDK's retries, a per-attempt timeout, redirects refused, and every failure",
    " * mapped onto the neutral `PaymentsError` channel. Results are typed with",
    " * Distilled's declarations and are **not validated** (lenient), so a field",
    " * Distilled marks required may be absent at an older `apiVersion`.",
    " *",
    " * Operations require `StripeHttp`: provide `StripeHttp.layer` (with",
    " * `FetchHttpClient.layer`), `StripeHttp.layerConfig` or `StripeHttp.layerFromEnv`.",
    " *",
    ` * Generated by \`scripts/generate-resources.ts\` from \`@distilled.cloud/stripe\` ${version};`,
    " * edit `scripts/resources.ts` and regenerate rather than this file.",
    " *",
    " * @module",
    " */",
    "",
    'import type { Effect } from "effect";',
    'import * as Distilled from "@distilled.cloud/stripe/stripe";',
    'import type { PaymentsError } from "@thomasfosterau/effect-payments";',
    'import { operation } from "./internal/resource.js";',
    'import type { RequestOptions, StripeHttp } from "./StripeHttp.js";',
    "",
    "/**",
    " * The input and output types (each also its `Schema`) of this module's",
    " * operations, as `@distilled.cloud/stripe/stripe` declares them.",
    " */",
    `export { ${types.join(", ")} } from "@distilled.cloud/stripe/stripe";`,
    "",
    operations.map(renderOperation).join("\n\n"),
    "",
  ].join("\n");
};

/** A generated module the formatter refused. */
class FormatError extends Schema.TaggedError<FormatError>()("FormatError", {
  file: Schema.String,
  messages: Schema.Array(Schema.String),
}) {}

/** Every generated resource module, by its path under the package (`src/Customer.ts`), formatted. */
export const render = (
  planned: Plan,
  version: string,
): Effect.Effect<ReadonlyMap<string, string>, FormatError> =>
  Effect.map(
    Effect.forEach(
      [...planned.modules],
      ([subpath, operations]) => {
        const file = `src/${subpath}.ts`;
        return Effect.tryPromise({
          try: () => format(file, renderModule(subpath, operations, version)),
          catch: (cause) => new FormatError({ file, messages: [String(cause)] }),
        }).pipe(
          Effect.flatMap(({ code, errors }) =>
            errors.length === 0
              ? Effect.succeed([file, code] as const)
              : Effect.fail(
                  new FormatError({ file, messages: errors.map((error) => error.message) }),
                ),
          ),
        );
      },
      { concurrency: "unbounded" },
    ),
    (files) => new Map(files),
  );
