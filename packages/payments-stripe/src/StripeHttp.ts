/**
 * The fetch-only Stripe transport.
 *
 * `StripeHttp` is the one service every Stripe resource module and capability
 * layer runs on: a single {@link StripeHttp.request} that speaks Stripe's v1
 * wire protocol over `effect/unstable/http`'s `HttpClient`. It needs no Node
 * API and no SDK, so it runs unchanged in a Cloudflare Worker — provide
 * `FetchHttpClient.layer` in production, or a stubbed `FetchHttpClient.Fetch`
 * in tests.
 *
 * What it does on every call:
 *
 * - **Authenticates** with the secret key as a bearer token. The key is a
 *   `Redacted` from configuration to the header and never reaches an error or
 *   a log line.
 * - **Pins the API version** in a `Stripe-Version` header
 *   ({@link DEFAULT_API_VERSION} unless configured), so an account-level
 *   dashboard setting cannot change the wire shape under the decoders.
 * - **Form-encodes** parameters the way the SDK does (bracketed nesting,
 *   `items[0][price]`), as the body of a `POST` or the query of a `GET` /
 *   `DELETE`; a file upload goes as `multipart/form-data` to the uploads host.
 * - **Refuses redirects** (`redirect: "error"` on the fetch client): following
 *   one would replay the `Authorization` header at whatever host it named.
 *   `fetch` reports a refused redirect as a network failure, which cannot be
 *   told apart portably from any other, so it is retried like one and then
 *   fails with `PaymentNetworkError`; no attempt ever reaches the redirect
 *   target.
 * - **Retries** connection failures, `409`s and `5xx`s (deferring to a
 *   `Stripe-Should-Retry` header) with the SDK's backoff, reusing one
 *   `Idempotency-Key` across the attempts of a `POST`.
 * - **Maps failures** onto the neutral {@link PaymentsError} channel, decoding
 *   Stripe's `{ error: { type, code, message, param } }` envelope with
 *   `Schema` and applying the same mapping as the SDK transport.
 *
 * The official SDK remains available as an alternative transport (`Stripe`),
 * which provides this same service through `stripe.rawRequest`.
 *
 * @module
 */

import {
  Config,
  Context,
  Data,
  Duration,
  Effect,
  Layer,
  Option,
  Predicate,
  Random,
  Redacted,
  Schema,
} from "effect";
import {
  FetchHttpClient,
  HttpClient,
  type HttpClientError,
  HttpClientRequest,
} from "effect/unstable/http";
import {
  PaymentConfigError,
  PaymentInvalidRequestError,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import { classifyResponse, retryAfterOf, toPaymentsError } from "./internal/error.js";
import { encodeForm, entriesOf, flattenParams } from "./internal/form.js";
import type { StripeParams } from "./internal/params.js";

/**
 * The Stripe API version requests are pinned to unless the configuration
 * names another. It matches the version the `stripe` SDK's types (which the
 * resource modules return) describe.
 */
export const DEFAULT_API_VERSION = "2025-02-24.acacia";

const DEFAULT_BASE_URL = "https://api.stripe.com";
const DEFAULT_UPLOADS_BASE_URL = "https://files.stripe.com";
/** The SDK's defaults: two retries, an 80 s timeout per attempt. */
const DEFAULT_MAX_NETWORK_RETRIES = 2;
const DEFAULT_TIMEOUT_MS = 80_000;
/** The SDK's backoff bounds, in seconds. */
const INITIAL_RETRY_DELAY_S = 0.5;
const MAX_RETRY_DELAY_S = 5;
const MAX_RETRY_AFTER_S = 60;

/** Configuration for the fetch transport. */
export interface StripeHttpConfig {
  /** The secret (or restricted) API key, `sk_…` / `rk_…`. */
  readonly apiKey: Redacted.Redacted<string>;
  /** The `Stripe-Version` to pin. Defaults to {@link DEFAULT_API_VERSION}. */
  readonly apiVersion?: string | undefined;
  /** Retries after a retryable failure. Defaults to 2, as in the SDK. */
  readonly maxNetworkRetries?: number | undefined;
  /** Per-attempt timeout in milliseconds. Defaults to 80 000, as in the SDK. */
  readonly timeout?: number | undefined;
  /** A connected account to act as on every call (`Stripe-Account`). */
  readonly stripeAccount?: string | undefined;
  /** Override the API origin (e.g. a `stripe-mock` server). */
  readonly baseUrl?: string | undefined;
  /** Override the file-uploads origin. */
  readonly uploadsBaseUrl?: string | undefined;
}

/** The HTTP methods Stripe's v1 API uses. */
export type StripeMethod = "GET" | "POST" | "DELETE";

/** One request issued through {@link StripeHttp}. */
export interface StripeRequest {
  readonly method: StripeMethod;
  /** The API path, beginning `/v1/`; path segments already URI-encoded. */
  readonly path: string;
  /** Parameters, form-encoded into the body (`POST`) or the query. */
  readonly params?: StripeParams | undefined;
  /**
   * An `Idempotency-Key` for a `POST`. Without one, a `POST` that may be
   * retried gets a generated key shared by all of its attempts.
   */
  readonly idempotencyKey?: string | undefined;
  /** A connected account to act as, overriding the configured one. */
  readonly stripeAccount?: string | undefined;
  /**
   * Send the parameters as `multipart/form-data` to the uploads origin (the
   * Files API). A parameter shaped `{ data, name?, type? }` becomes a file
   * part (`data` a string, a `Uint8Array` or a `Blob`), as does a bare
   * `Uint8Array` or `Blob`.
   */
  readonly upload?: boolean | undefined;
}

/**
 * The Stripe transport. Resolves to the response's JSON, unchecked: callers
 * name the shape they expect (resource modules) or decode it (capability
 * layers). Tests can provide a fake {@link StripeHttp.request}.
 */
export class StripeHttp extends Context.Service<
  StripeHttp,
  {
    readonly request: (request: StripeRequest) => Effect.Effect<unknown, PaymentsError>;
  }
>()("@effect-payments-stripe/StripeHttp") {}

/** A file part of an upload, as the SDK accepts it. */
interface FilePart {
  readonly data: unknown;
  readonly name?: string | undefined;
  readonly type?: string | undefined;
}

const isFilePart = (value: unknown): value is FilePart =>
  Predicate.isObject(value) && "data" in value;

/** Raw bytes passed directly as a parameter, which are a file too. */
const isBytes = (value: unknown): value is Blob | Uint8Array =>
  value instanceof Blob || value instanceof Uint8Array;

const blobOf = (part: FilePart): Blob | undefined => {
  const options = { type: part.type ?? "application/octet-stream" };
  if (part.data instanceof Blob) return part.data;
  if (Predicate.isString(part.data)) return new Blob([part.data], options);
  if (part.data instanceof Uint8Array) {
    // SAFETY: a `Uint8Array` over any buffer is a valid `BlobPart` at runtime;
    // the DOM typings only admit one over a plain `ArrayBuffer`.
    return new Blob([part.data as Uint8Array<ArrayBuffer>], options);
  }
  return undefined;
};

/** One multipart field: text, or a file with its name. */
type FormPart =
  | { readonly name: string; readonly text: string }
  | { readonly name: string; readonly blob: Blob; readonly filename: string };

/** One upload parameter's multipart fields, or why it cannot be sent. */
const formPartsOf = ([key, input]: readonly [string, unknown]): Effect.Effect<
  ReadonlyArray<FormPart>,
  PaymentInvalidRequestError
> => {
  const value: unknown = isBytes(input) ? { data: input } : input;
  if (!isFilePart(value)) {
    return Effect.succeed(flattenParams({ [key]: value }).map(([name, text]) => ({ name, text })));
  }
  const blob = blobOf(value);
  return blob === undefined
    ? Effect.fail(
        new PaymentInvalidRequestError({
          message: `Upload parameter "${key}" must carry its data as a string, a Uint8Array or a Blob`,
          param: key,
        }),
      )
    : Effect.succeed([{ name: key, blob, filename: value.name ?? "blob" }]);
};

/** The multipart body of an upload. */
const formDataOf = (
  params: StripeParams | undefined,
): Effect.Effect<FormData, PaymentInvalidRequestError> =>
  Effect.map(Effect.forEach(entriesOf(params), formPartsOf, { concurrency: 1 }), (fields) => {
    const form = new FormData();
    fields.flat().forEach((part) => {
      if ("text" in part) form.append(part.name, part.text);
      else form.append(part.name, part.blob, part.filename);
    });
    return form;
  });

/** A request's outcome, before it is judged: a response, or no response. */
type Outcome = Data.TaggedEnum<{
  Response: {
    readonly status: number;
    readonly headers: Readonly<Record<string, string | undefined>>;
    readonly body: Option.Option<unknown>;
  };
  Transport: { readonly message: string; readonly cause: unknown };
}>;
const Outcome = Data.taggedEnum<Outcome>();

const decodeJson = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Unknown));

const isOk = (status: number): boolean => status >= 200 && status < 300;

/**
 * The SDK's retry rule: always after a connection failure; otherwise as the
 * `Stripe-Should-Retry` header says, and without one on a `409` or a `5xx`.
 */
const isRetryable: (outcome: Outcome) => boolean = Outcome.$match({
  Transport: () => true,
  Response: ({ status, headers }) => {
    if (isOk(status)) return false;
    const advice = headers["stripe-should-retry"];
    if (advice === "false") return false;
    if (advice === "true") return true;
    return status === 409 || status >= 500;
  },
});

/** The `Retry-After` a response asked for, in seconds. */
const retryAfterOfOutcome: (outcome: Outcome) => number | undefined = Outcome.$match({
  Transport: () => undefined,
  Response: ({ headers }) => retryAfterOf(headers["retry-after"]),
});

/**
 * The SDK's backoff before retry `retries + 1`: exponential from 0.5 s,
 * capped at 5 s, jittered into its upper half, never below 0.5 s, and never
 * shorter than a reasonable (≤ 60 s) `Retry-After`.
 */
const backoff = (retries: number, retryAfter: number | undefined): Effect.Effect<void> =>
  Effect.flatMap(Random.next, (jitter) => {
    const exponential = Math.min(INITIAL_RETRY_DELAY_S * 2 ** (retries - 1), MAX_RETRY_DELAY_S);
    const jittered = Math.max(INITIAL_RETRY_DELAY_S, exponential * 0.5 * (1 + jitter));
    const seconds =
      retryAfter !== undefined && retryAfter <= MAX_RETRY_AFTER_S
        ? Math.max(jittered, retryAfter)
        : jittered;
    return Effect.sleep(Duration.millis(seconds * 1000));
  });

/** A string `message` on an unknown cause, if it has one. */
const messageOf = (cause: unknown): string | undefined =>
  Predicate.hasProperty(cause, "message") && Predicate.isString(cause.message)
    ? cause.message
    : undefined;

/**
 * The underlying failure of an `HttpClientError`, without the request it
 * carries — whose `Authorization` header holds the key.
 */
const transportOf = (error: HttpClientError.HttpClientError): Outcome => {
  const reason = error.reason;
  const cause = "cause" in reason ? reason.cause : undefined;
  const description =
    "description" in reason && Predicate.isString(reason.description)
      ? reason.description
      : undefined;
  return Outcome.Transport({
    message: description ?? messageOf(cause) ?? reason._tag,
    cause,
  });
};

/** The JSON of a 2xx, or a neutral error for anything else. */
const settleResponse = ({
  status,
  headers,
  body,
}: Data.TaggedEnum.Value<Outcome, "Response">): Effect.Effect<unknown, PaymentsError> => {
  if (!isOk(status)) {
    return Effect.fail(
      toPaymentsError(
        classifyResponse(status, headers["retry-after"], Option.getOrUndefined(body)),
      ),
    );
  }
  return Option.match(body, {
    onSome: Effect.succeed,
    onNone: () =>
      Effect.fail(
        toPaymentsError({
          kind: "StripeAPIError",
          message: "Invalid JSON received from the Stripe API",
          statusCode: status,
        }),
      ),
  });
};

/** Judge a final outcome: the JSON of a 2xx, or a neutral error. */
const settle = (outcome: Outcome, retries: number): Effect.Effect<unknown, PaymentsError> =>
  Outcome.$match(outcome, {
    Response: settleResponse,
    Transport: ({ message, cause }) => {
      const retried = retries > 0 ? ` Request was retried ${retries} times.` : "";
      return Effect.fail(
        toPaymentsError({
          kind: "StripeConnectionError",
          message: `An error occurred with our connection to Stripe (${message}).${retried}`,
          raw: cause,
        }),
      );
    },
  });

/** Set a header when it has a value. */
const withHeader =
  (name: string, value: string | undefined) =>
  (request: HttpClientRequest.HttpClientRequest): HttpClientRequest.HttpClientRequest =>
    value === undefined ? request : HttpClientRequest.setHeader(request, name, value);

/**
 * Build the fetch transport from configuration. Fails with
 * {@link PaymentConfigError} when the key is empty.
 */
export const make = (
  config: StripeHttpConfig,
): Effect.Effect<StripeHttp["Service"], PaymentConfigError, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    if (Redacted.value(config.apiKey) === "") {
      return yield* new PaymentConfigError({ message: "Stripe API key is required" });
    }
    const http = yield* HttpClient.HttpClient;
    const apiVersion = config.apiVersion || DEFAULT_API_VERSION;
    const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    const uploadsBaseUrl = config.uploadsBaseUrl ?? DEFAULT_UPLOADS_BASE_URL;
    const maxRetries = Math.max(0, config.maxNetworkRetries ?? DEFAULT_MAX_NETWORK_RETRIES);
    const timeout = Duration.millis(config.timeout ?? DEFAULT_TIMEOUT_MS);

    /** Execute with redirects refused, keeping any other fetch defaults. */
    const execute = (request: HttpClientRequest.HttpClientRequest) =>
      Effect.flatMap(Effect.serviceOption(FetchHttpClient.RequestInit), (init) =>
        http.execute(request).pipe(
          Effect.provideService(FetchHttpClient.RequestInit, {
            ...Option.getOrElse(init, () => ({})),
            redirect: "error",
          }),
        ),
      );

    /** One attempt, reduced to an {@link Outcome}; never fails. */
    const attempt = (request: HttpClientRequest.HttpClientRequest): Effect.Effect<Outcome> =>
      execute(request).pipe(
        Effect.flatMap((response) =>
          Effect.map(response.text, (text) =>
            Outcome.Response({
              status: response.status,
              headers: response.headers,
              body: decodeJson(text),
            }),
          ),
        ),
        Effect.timeoutOption(timeout),
        Effect.map(
          Option.getOrElse(() =>
            Outcome.Transport({
              message: `request timed out after ${Duration.toMillis(timeout)} ms`,
              cause: undefined,
            }),
          ),
        ),
        Effect.catchTag("HttpClientError", (error) => Effect.succeed(transportOf(error))),
      );

    const run = (
      request: HttpClientRequest.HttpClientRequest,
      retries: number,
    ): Effect.Effect<unknown, PaymentsError> =>
      Effect.flatMap(attempt(request), (outcome) =>
        retries < maxRetries && isRetryable(outcome)
          ? Effect.andThen(
              backoff(retries, retryAfterOfOutcome(outcome)),
              run(request, retries + 1),
            )
          : settle(outcome, retries),
      );

    const build = (
      request: StripeRequest,
      idempotencyKey: string | undefined,
    ): Effect.Effect<HttpClientRequest.HttpClientRequest, PaymentInvalidRequestError> => {
      const origin = request.upload ? uploadsBaseUrl : baseUrl;
      const authenticate = (base: HttpClientRequest.HttpClientRequest) =>
        base.pipe(
          HttpClientRequest.bearerToken(config.apiKey),
          HttpClientRequest.acceptJson,
          HttpClientRequest.setHeader("Stripe-Version", apiVersion),
          withHeader("Stripe-Account", request.stripeAccount ?? config.stripeAccount),
          withHeader("Idempotency-Key", idempotencyKey),
        );

      if (request.method !== "POST") {
        const query = encodeForm(request.params);
        const url = `${origin}${request.path}${query === "" ? "" : `?${query}`}`;
        return Effect.succeed(authenticate(HttpClientRequest.make(request.method)(url)));
      }
      const base = authenticate(HttpClientRequest.post(`${origin}${request.path}`));
      if (!request.upload) {
        return Effect.succeed(
          HttpClientRequest.bodyText(
            base,
            encodeForm(request.params),
            "application/x-www-form-urlencoded",
          ),
        );
      }
      return Effect.map(formDataOf(request.params), (form) =>
        HttpClientRequest.bodyFormData(base, form),
      );
    };

    const request = Effect.fn("StripeHttp.request")(function* (request: StripeRequest) {
      const idempotencyKey =
        request.idempotencyKey ??
        (request.method === "POST" && maxRetries > 0
          ? `effect-payments-retry-${yield* Effect.sync(() => globalThis.crypto.randomUUID())}`
          : undefined);
      return yield* run(yield* build(request, idempotencyKey), 0);
    });

    return StripeHttp.of({ request });
  });

/**
 * The fetch transport as a layer. Requires an `HttpClient`: provide
 * `FetchHttpClient.layer` (Workers, browsers, Node ≥ 18).
 */
export const layer = (
  config: StripeHttpConfig,
): Layer.Layer<StripeHttp, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.effect(StripeHttp, make(config));

/**
 * The fetch transport with its key read from a configuration variable
 * (through the current `ConfigProvider`, which defaults to the process
 * environment), at the default API version.
 */
export const layerFromEnv = (
  envVar: string = "STRIPE_API_KEY",
): Layer.Layer<StripeHttp, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.effect(
    StripeHttp,
    Effect.gen(function* () {
      const apiKey = yield* Config.Redacted(envVar).pipe(Config.withDefault(Redacted.make("")));
      if (Redacted.value(apiKey) === "") {
        return yield* new PaymentConfigError({
          message: `Environment variable ${envVar} is not set`,
        });
      }
      return yield* make({ apiKey });
    }).pipe(
      Effect.catchTag("ConfigError", (error) =>
        Effect.fail(new PaymentConfigError({ message: error.message })),
      ),
    ),
  );
