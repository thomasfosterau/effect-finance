/**
 * The client the capability layers (`StripePayments`) reach Stripe through:
 * Distilled's generated operations (`@distilled.cloud/stripe`), run under the
 * request policy this package has always applied to Stripe.
 *
 * Distilled builds and sends each request (the bearer key from its
 * `Credentials`, Stripe's bracketed form encoding, the `Idempotency-Key` /
 * `Stripe-Account` / `Stripe-Version` headers from `withRequestOptions`) and
 * reads the response. Around every operation this module:
 *
 * - **pins `Stripe-Version`** to {@link DEFAULT_API_VERSION} unless configured.
 *   Distilled sends the header only when asked, and otherwise the account's
 *   dashboard default would decide the wire shape;
 * - **pins lenient response validation**. Distilled's schemas are generated
 *   from a newer Stripe API version than the pinned one, so its strict mode
 *   would refuse pinned-version responses over fields this package never
 *   reads; the capability layers decode the fields they map instead;
 * - **owns retries**: Distilled's are switched off, and an attempt that failed
 *   to connect, or answered `409` / `5xx` (as `Stripe-Should-Retry` allows),
 *   is retried with the SDK's backoff, reusing one `Idempotency-Key` across
 *   the attempts of a `POST`;
 * - **times out** each attempt and **refuses redirects**, which would replay
 *   the `Authorization` header to whatever host they named;
 * - **classifies failures** onto the neutral {@link PaymentsError} channel with
 *   `toPaymentsError`, the mapping the fetch and SDK transports share.
 *   Distilled's error classes carry neither the HTTP status (which decides
 *   401, 403 and 429 whatever the body says) nor the whole vendor error
 *   object, so the client watches the response through the `HttpClient` it
 *   hands Distilled and classifies that. A failure with no response behind it
 *   is a connection failure ({@link PaymentNetworkError}), or a Distilled error
 *   mapped to {@link PaymentProviderError} by its tag.
 *
 * The key stays a `Redacted` until Distilled sets the header; a connection
 * failure's `cause` is the underlying error, never the request that carries
 * the header.
 *
 * @module
 */

import {
  Config,
  ConfigProvider,
  Context,
  Data,
  Duration,
  Effect,
  Layer,
  Option,
  Predicate,
  Random,
  Redacted,
  Ref,
  Schema,
} from "effect";
import { FetchHttpClient, HttpClient, HttpClientError } from "effect/http";
import { ResponseValidation } from "@distilled.cloud/core/response-validation";
import { Credentials, type Config as StripeCredentials } from "@distilled.cloud/stripe/Credentials";
import {
  type StripeOpContext,
  type StripeRequestOptions,
  withRequestOptions,
} from "@distilled.cloud/stripe/Protocol";
import { Retry } from "@distilled.cloud/stripe/Retry";
import {
  PaymentConfigError,
  PaymentProviderError,
  type PaymentsError,
  PaymentsUnavailable,
} from "@thomasfosterau/effect-payments";
import {
  DEFAULT_API_VERSION,
  type LayerConfigOptions,
  type StripeHttpConfig,
} from "../StripeHttp.js";
import { classifyResponse, PROVIDER, retryAfterOf, toPaymentsError } from "./error.js";
import { checkOptions } from "./options.js";

const DEFAULT_BASE_URL = "https://api.stripe.com";
/** The SDK's defaults: two retries, an 80 s timeout per attempt. */
const DEFAULT_MAX_NETWORK_RETRIES = 2;
const DEFAULT_TIMEOUT_MS = 80_000;
/** The SDK's backoff bounds, in seconds. */
const INITIAL_RETRY_DELAY_S = 0.5;
const MAX_RETRY_DELAY_S = 5;
const MAX_RETRY_AFTER_S = 60;

/** The request policy of a client: {@link StripeHttpConfig} without the key and the origins. */
export type ClientOptions = Pick<
  StripeHttpConfig,
  "apiVersion" | "maxNetworkRetries" | "timeout" | "stripeAccount"
>;

/**
 * An operation's HTTP method. A `POST` sent without a caller's key gets a
 * generated one when it may be retried, so its attempts are one write.
 */
export type Method = "GET" | "POST" | "DELETE";

/** One Distilled operation, as the generated `@distilled.cloud/stripe/stripe` module exports it. */
export type Operation<I, O, E> = (input: I) => Effect.Effect<O, E, StripeOpContext>;

/**
 * The client service the capability layers are built over. `call` resolves to
 * the response JSON as Distilled read it, **unchecked**: Distilled validates
 * nothing in lenient mode, so the caller decodes the fields it maps.
 */
export class StripeClient extends Context.Service<
  StripeClient,
  {
    readonly call: <I, O, E>(
      method: Method,
      operation: Operation<I, O, E>,
      input: I,
      idempotencyKey?: string | undefined,
    ) => Effect.Effect<unknown, PaymentsError>;
  }
>()("@effect-payments-stripe/internal/StripeClient") {}

/** What one attempt saw of the response, read before Distilled reads it. */
interface Observed {
  readonly status: number;
  readonly headers: Readonly<Record<string, string | undefined>>;
  /** The JSON body, or `None` for a body that is not JSON. */
  readonly body: Option.Option<unknown>;
}

/** One attempt's outcome, before it is judged. */
type Outcome = Data.TaggedEnum<{
  /** Distilled succeeded on a 2xx with a JSON body. */
  Success: { readonly body: unknown };
  /** A response that decides the outcome: a non-2xx, or a 2xx that is not JSON. */
  Response: Observed;
  /** No response: a connection failure or a timeout. */
  Transport: { readonly message: string; readonly cause: unknown };
  /** A Distilled failure with no non-2xx response behind it. */
  Rejected: { readonly error: unknown };
}>;
const Outcome = /* @__PURE__ */ Data.taggedEnum<Outcome>();

const decodeJson = /* @__PURE__ */ Schema.decodeUnknownOption(
  /* @__PURE__ */ Schema.fromJsonString(Schema.Unknown),
);

const isOk = (status: number): boolean => status >= 200 && status < 300;

/** Distilled's retries, switched off: this client retries on its own policy. */
const NO_RETRY = { while: () => false };

/**
 * The SDK's retry rule for a response: as the `Stripe-Should-Retry` header
 * says, and without one on a `409` or a `5xx`.
 */
const isRetryableResponse = ({ status, headers }: Observed): boolean => {
  if (isOk(status)) return false;
  const advice = headers["stripe-should-retry"];
  return advice === undefined ? status === 409 || status >= 500 : advice === "true";
};

/** The SDK's retry rule: always after a connection failure, else by the response. */
const isRetryable: (outcome: Outcome) => boolean = /* @__PURE__ */ Outcome.$match({
  Success: () => false,
  Response: isRetryableResponse,
  Transport: () => true,
  Rejected: () => false,
});

/** The `Retry-After` an outcome's response asked for, in seconds. */
const retryAfterOfOutcome = (outcome: Outcome): number | undefined =>
  Outcome.$is("Response")(outcome) ? retryAfterOf(outcome.headers["retry-after"]) : undefined;

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

/** A string field of an unknown value, if it has one. */
const stringField = (value: unknown, field: string): string | undefined =>
  Predicate.hasProperty(value, field) && Predicate.isString(value[field])
    ? value[field]
    : undefined;

/**
 * A Distilled failure as an outcome. An `HttpClientError` means no response
 * arrived; its `cause` is kept, never the request, whose headers carry the key.
 */
const failureOf = (error: unknown): Outcome => {
  if (!HttpClientError.isHttpClientError(error)) return Outcome.Rejected({ error });
  const reason = error.reason;
  const cause = "cause" in reason ? reason.cause : undefined;
  return Outcome.Transport({
    message: stringField(reason, "description") ?? stringField(cause, "message") ?? reason._tag,
    cause,
  });
};

/**
 * The outcome of one attempt. A response, once seen, decides it whatever
 * Distilled made of it: a non-2xx is classified from its status, headers and
 * body, and a 2xx whose body is not JSON fails as one.
 */
const judge = (outcome: Outcome, observed: Option.Option<Observed>): Outcome =>
  Option.match(observed, {
    onNone: () => outcome,
    onSome: (response) => {
      const decides = Outcome.$is("Success")(outcome)
        ? !isOk(response.status) || Option.isNone(response.body)
        : !isOk(response.status);
      return decides ? Outcome.Response(response) : outcome;
    },
  });

/** A response that decides an outcome, as a neutral error. */
const responseError = ({ status, headers, body }: Observed): PaymentsError =>
  isOk(status)
    ? toPaymentsError({
        kind: "StripeAPIError",
        message: "Invalid JSON received from the Stripe API",
        statusCode: status,
      })
    : toPaymentsError(
        classifyResponse(status, headers["retry-after"], Option.getOrUndefined(body)),
      );

/** A Distilled failure with no response behind it, as a neutral error named by its tag. */
const rejectedError = ({ error }: { readonly error: unknown }): PaymentsError =>
  new PaymentProviderError({
    message: stringField(error, "message") ?? "The Stripe request failed",
    provider: PROVIDER,
    code: stringField(error, "_tag") ?? "StripeUnknownError",
    cause: error,
  });

/** Judge a final outcome, after `retries` retries: the JSON of a 2xx, or a neutral error. */
const settle = (outcome: Outcome, retries: number): Effect.Effect<unknown, PaymentsError> =>
  Outcome.$match(outcome, {
    Success: ({ body }) => Effect.succeed(body),
    Response: (response) => Effect.fail(responseError(response)),
    Transport: ({ message, cause }) =>
      Effect.fail(
        toPaymentsError({
          kind: "StripeConnectionError",
          message: `An error occurred with our connection to Stripe (${message}).${
            retries > 0 ? ` Request was retried ${retries} times.` : ""
          }`,
          raw: cause,
        }),
      ),
    Rejected: (rejected) => Effect.fail(rejectedError(rejected)),
  });

/** The client's credentials and request policy. */
interface MakeOptions extends ClientOptions {
  /** The key and API origin, resolved on every call; may fail (`PaymentsUnavailable`). */
  readonly credentials: Effect.Effect<StripeCredentials, PaymentsError>;
}

/** Build the client over the `HttpClient` in context. */
const make = (
  options: MakeOptions,
): Effect.Effect<StripeClient["Service"], never, HttpClient.HttpClient> =>
  Effect.map(HttpClient.HttpClient, (http) => {
    const apiVersion = options.apiVersion || DEFAULT_API_VERSION;
    const maxRetries = Math.max(0, options.maxNetworkRetries ?? DEFAULT_MAX_NETWORK_RETRIES);
    const timeout = Duration.millis(options.timeout ?? DEFAULT_TIMEOUT_MS);
    const timedOut = Outcome.Transport({
      message: `request timed out after ${Duration.toMillis(timeout)} ms`,
      cause: undefined,
    });

    /** One attempt of `operation`, reduced to an {@link Outcome}; fails only by defect. */
    const attempt = <I, O, E>(
      operation: Operation<I, O, E>,
      input: I,
      requestOptions: StripeRequestOptions,
      credentials: StripeCredentials,
    ): Effect.Effect<Outcome> =>
      Effect.gen(function* () {
        const observed = yield* Ref.make(Option.none<Observed>());
        // Read the body first (the response caches it, so Distilled reads it
        // again), and keep what the classification needs.
        const watched = HttpClient.transform(http, (response) =>
          Effect.tap(response, (seen) =>
            Effect.flatMap(seen.text, (text) =>
              Ref.set(
                observed,
                Option.some({ status: seen.status, headers: seen.headers, body: decodeJson(text) }),
              ),
            ),
          ),
        );
        const init = yield* Effect.serviceOption(FetchHttpClient.RequestInit);
        const outcome = yield* operation(input).pipe(
          // Every typed failure becomes an outcome to judge; defects stay defects.
          Effect.match({
            onSuccess: (body) => Outcome.Success({ body }),
            onFailure: failureOf,
          }),
          withRequestOptions(requestOptions),
          Effect.provideService(Credentials, Effect.succeed(credentials)),
          Effect.provideService(HttpClient.HttpClient, watched),
          Effect.provideService(Retry, NO_RETRY),
          Effect.provideService(ResponseValidation, "lenient"),
          Effect.provideService(FetchHttpClient.RequestInit, {
            ...Option.getOrElse(init, () => ({})),
            redirect: "error",
          }),
          Effect.timeoutOption(timeout),
          Effect.map(Option.getOrElse(() => timedOut)),
        );
        return judge(outcome, yield* Ref.get(observed));
      });

    const run = (
      once: Effect.Effect<Outcome>,
      retries: number,
    ): Effect.Effect<unknown, PaymentsError> =>
      Effect.flatMap(once, (outcome) =>
        retries < maxRetries && isRetryable(outcome)
          ? Effect.andThen(backoff(retries, retryAfterOfOutcome(outcome)), run(once, retries + 1))
          : settle(outcome, retries),
      );

    const call = Effect.fn("StripeClient.call")(function* <I, O, E>(
      method: Method,
      operation: Operation<I, O, E>,
      input: I,
      idempotencyKey?: string | undefined,
    ) {
      const credentials = yield* options.credentials;
      yield* checkOptions({ idempotencyKey, stripeAccount: options.stripeAccount });
      const key =
        idempotencyKey ??
        (method === "POST" && maxRetries > 0
          ? `effect-payments-retry-${yield* Effect.sync(() => globalThis.crypto.randomUUID())}`
          : undefined);
      const requestOptions: StripeRequestOptions = {
        apiVersion,
        idempotencyKey: key,
        stripeAccount: options.stripeAccount,
      };
      return yield* run(attempt(operation, input, requestOptions, credentials), 0);
    });

    return StripeClient.of({ call });
  });

/**
 * The client over Distilled's `Credentials` in context, at the default
 * request policy (the pinned API version, two retries, 80 s per attempt).
 */
export const layerFromContext: Layer.Layer<
  StripeClient,
  never,
  Credentials | HttpClient.HttpClient
> = /* @__PURE__ */ Layer.effect(
  StripeClient,
  /* @__PURE__ */ Effect.flatMap(Credentials, (credentials) => make({ credentials })),
);

/** The credentials a configuration names. */
const credentialsOf = (
  apiKey: Redacted.Redacted<string>,
  baseUrl: string | undefined,
): StripeCredentials => ({ apiKey, apiBaseUrl: baseUrl ?? DEFAULT_BASE_URL });

/**
 * The client from configuration. Fails with {@link PaymentConfigError} when
 * the key is empty.
 */
const fromConfig = (
  config: StripeHttpConfig,
): Effect.Effect<StripeClient["Service"], PaymentConfigError, HttpClient.HttpClient> =>
  Redacted.value(config.apiKey) === ""
    ? Effect.fail(new PaymentConfigError({ message: "Stripe API key is required" }))
    : make({
        ...config,
        credentials: Effect.succeed(credentialsOf(config.apiKey, config.baseUrl)),
      });

/** The client from configuration, as a layer; see {@link fromConfig}. */
export const layer = (
  config: StripeHttpConfig,
): Layer.Layer<StripeClient, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.effect(StripeClient, fromConfig(config));

/**
 * The client with its key read from a configuration variable while the layer
 * is built. Fails with {@link PaymentConfigError} when it is absent or empty.
 */
export const layerFromEnv = (
  envVar: string,
): Layer.Layer<StripeClient, PaymentConfigError, HttpClient.HttpClient> =>
  Layer.effect(
    StripeClient,
    Effect.gen(function* () {
      const apiKey = yield* Config.Redacted(envVar).pipe(Config.withDefault(Redacted.make("")));
      if (Redacted.value(apiKey) === "") {
        return yield* new PaymentConfigError({
          message: `Environment variable ${envVar} is not set`,
        });
      }
      return yield* fromConfig({ apiKey });
    }).pipe(
      Effect.catchTag("ConfigError", (error) =>
        Effect.fail(new PaymentConfigError({ message: error.message })),
      ),
    ),
  );

/**
 * Read the key from one `ConfigProvider`: `None` when it is absent, empty or
 * unreadable. An unreadable value is logged at debug level (the variable's
 * name only, never its value) and then treated as absent.
 */
const readKey = (
  envVar: string,
  provider: ConfigProvider.ConfigProvider,
): Effect.Effect<Option.Option<Redacted.Redacted<string>>> =>
  Config.Redacted(envVar)
    .pipe(Config.option)
    .parse(provider)
    .pipe(
      Effect.map(Option.filter((key) => Redacted.value(key) !== "")),
      Effect.catchTag("ConfigError", () =>
        Effect.as(
          Effect.logDebug(`Stripe key ${envVar} could not be read; treating it as not set`),
          Option.none(),
        ),
      ),
    );

/**
 * The client in the "not configured ≡ down" posture: the key is read from a
 * configuration variable on every call (the calling fiber's `ConfigProvider`
 * first, then the one the layer was built under), so building it cannot fail,
 * and a call made while the key is absent, empty or unreadable fails with
 * {@link PaymentsUnavailable} before anything is sent.
 */
export const layerConfig = ({
  envVar = "STRIPE_API_KEY",
  ...options
}: LayerConfigOptions): Layer.Layer<StripeClient, never, HttpClient.HttpClient> =>
  Layer.effect(
    StripeClient,
    Effect.gen(function* () {
      const builtUnder = yield* ConfigProvider.ConfigProvider;
      const unavailable = Effect.failSync(
        () =>
          new PaymentsUnavailable({
            message: `Stripe is not configured in this environment (${envVar} is not set or is empty)`,
            provider: PROVIDER,
          }),
      );
      const credentials = Effect.flatMap(ConfigProvider.ConfigProvider, (caller) =>
        Effect.flatMap(readKey(envVar, caller), (key) =>
          Option.isSome(key) || caller === builtUnder
            ? Effect.succeed(key)
            : readKey(envVar, builtUnder),
        ),
      ).pipe(
        Effect.flatMap(
          Option.match({
            onNone: () => unavailable,
            onSome: (apiKey) => Effect.succeed(credentialsOf(apiKey, options.baseUrl)),
          }),
        ),
      );
      return yield* make({ ...options, credentials });
    }),
  );
