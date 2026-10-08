/**
 * Example: handling Stripe webhooks with @thomasfosterau/effect-payments-stripe
 *
 * This example demonstrates how to:
 * - Verify a delivery with the WebCrypto `Webhook.verify` (no `stripe` SDK, no
 *   Node API, so the same handler runs in a Cloudflare Worker)
 * - Pass the raw body bytes, never a re-serialised parsed object
 * - Read the signing secret as a `Redacted` through `Config`
 * - Answer every `SignatureVerificationError` with a bare 400
 * - Narrow a verified event to the handled types with `decodeHandledEvent`,
 *   and answer a handled event that fails to decode with a 500 so Stripe
 *   keeps redelivering it until a fix ships
 * - Sign a test delivery with `Webhook.signatureHeader` to exercise the handler
 *
 * It needs no Stripe account, API key or network: the demo at the bottom signs
 * its own deliveries with a test secret.
 *
 * The SDK-based `Webhook.constructEvent` / `constructEventAsync` remain as an
 * optional alternative; they need the `stripe` peer and the SDK client from
 * `Stripe.layer`.
 */

import {
  Clock,
  Config,
  ConfigProvider,
  Console,
  Effect,
  Match,
  Option,
  Redacted,
  Schema,
} from "effect";
import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";

/** The variable the endpoint's signing secret (`whsec_…`) is read from. */
const SECRET_VAR = "STRIPE_WEBHOOK_SECRET";

/** Act on a subscription state change: every `customer.subscription.*` type. */
const subscriptionChanged = (event: {
  readonly type: string;
  readonly data: { readonly object: Webhook.SubscriptionObject };
}) => {
  const subscription = event.data.object;
  return Console.log(
    `${event.type}: ${subscription.id} is ${subscription.status} for ${subscription.customer}`,
  );
};

/**
 * Act on a handled event. Each branch sees `data.object` decoded by the schema
 * for its type, so the fields a handler reads are typed, and a handled type
 * without a branch fails to compile.
 */
const handleEvent = Match.type<Webhook.HandledEvent>().pipe(
  Match.discriminatorsExhaustive("type")({
    "checkout.session.completed": (event) => {
      const session = event.data.object;
      return Console.log(
        `Checkout session ${session.id} completed (customer ${session.customer ?? "none"}, subscription ${session.subscription ?? "none"})`,
      );
    },
    "customer.subscription.created": subscriptionChanged,
    "customer.subscription.updated": subscriptionChanged,
    "customer.subscription.deleted": subscriptionChanged,
    "invoice.payment_failed": (event) => {
      const invoice = event.data.object;
      const subscription = Option.getOrElse(Webhook.invoiceSubscription(invoice), () => "none");
      return Console.log(
        `Invoice ${invoice.id ?? "?"} payment failed (customer ${invoice.customer ?? "?"}, subscription ${subscription})`,
      );
    },
  }),
);

/** A response with no body: Stripe reads only the status. */
const status = (code: number) => Effect.succeed(new Response(null, { status: code }));

/** The request body could not be read (the client went away mid-request). */
class UnreadableBodyError extends Schema.TaggedError<UnreadableBodyError>()(
  "UnreadableBodyError",
  {},
) {}

/**
 * A validly signed event of a handled type whose `data.object` does not match
 * the schema the handler reads: breakage on this side (say, a field moved in a
 * new API version), not a bad delivery. It carries only the event's id and
 * type, never the decode failure, whose text can echo payload fields.
 */
class UndecodableEventError extends Schema.TaggedError<UndecodableEventError>()(
  "UndecodableEventError",
  { id: Schema.String, type: Schema.String },
) {}

/**
 * Build the webhook endpoint: a web-standard `Request` → `Response` handler,
 * as a Worker's `fetch`, a Node adapter or any framework route would call it.
 *
 * The secret is read once, when the handler is built: a missing
 * `STRIPE_WEBHOOK_SECRET` fails here with a `ConfigError`, never per request.
 */
const makeWebhookHandler = Effect.fn("makeWebhookHandler")(function* () {
  const secret = yield* Config.Redacted(SECRET_VAR);

  return Effect.fn("handleStripeWebhook")(
    function* (request: Request) {
      // The signature is over the raw bytes exactly as received: never
      // `request.json()` re-serialised, and not `request.text()`, which is lossy.
      const payload = new Uint8Array(
        yield* Effect.tryPromise({
          try: () => request.arrayBuffer(),
          catch: () => new UnreadableBodyError(),
        }),
      );
      const event = yield* Webhook.verify({
        payload,
        header: request.headers.get(Webhook.SIGNATURE_HEADER),
        secret,
      });

      const handled = yield* Webhook.decodeHandledEvent(event).pipe(
        Effect.mapError(() => new UndecodableEventError({ id: event.id, type: event.type })),
      );
      if (Option.isSome(handled)) {
        yield* handleEvent(handled.value);
      } else {
        // Acknowledge an event type the system does not act on: refusing it
        // makes Stripe retry it.
        yield* Console.log(`Acknowledged unhandled event type ${event.type}`);
      }
      return yield* status(200);
    },
    // Stripe treats every non-2xx as a failed delivery and retries it, so the
    // status chiefly tells the operator which side is at fault.
    Effect.catchTags({
      // A bare 400 for every refusal: telling the caller which check failed
      // helps forge the next attempt. The error never carries the secret.
      SignatureVerificationError: () => status(400),
      // A signed body that is not an event envelope. Stripe only signs
      // envelopes, so genuine traffic never lands here.
      SchemaError: () => status(400),
      // The request body is broken, not the endpoint.
      UnreadableBodyError: () => status(400),
      // Our breakage: log the event, without its payload, and answer 500 so
      // Stripe keeps redelivering until a fix ships.
      UndecodableEventError: ({ id, type }) =>
        Effect.logError("Handled Stripe event failed to decode", { id, type }).pipe(
          Effect.andThen(status(500)),
        ),
    }),
  );
});

// ---------------------------------------------------------------------------
// Demo: exercise the handler with signed test deliveries
// ---------------------------------------------------------------------------

/** A delivery as Stripe would POST it. */
const delivery = (body: string, header: string | undefined) =>
  new Request("https://example.com/webhooks/stripe", {
    method: "POST",
    body,
    headers: header === undefined ? {} : { [Webhook.SIGNATURE_HEADER]: header },
  });

const checkoutCompleted = JSON.stringify({
  id: "evt_test_checkout",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_123",
      mode: "subscription",
      customer: "cus_test_123",
      subscription: "sub_test_123",
    },
  },
});

const chargeSucceeded = JSON.stringify({
  id: "evt_test_charge",
  type: "charge.succeeded",
  data: { object: { id: "ch_test_123" } },
});

// Signed and of a handled type, but without the `items` the subscription
// schema requires: the shape a field move in a new API version would produce.
const subscriptionWithoutItems = JSON.stringify({
  id: "evt_test_subscription",
  type: "customer.subscription.updated",
  data: {
    object: {
      id: "sub_test_123",
      customer: "cus_test_123",
      status: "active",
      cancel_at_period_end: false,
    },
  },
});

const demo = Effect.fn("demo")(function* () {
  const handle = yield* makeWebhookHandler();
  const secret = yield* Config.Redacted(SECRET_VAR);

  // `signatureHeader` signs exactly as Stripe does. It is for tests and
  // tooling only: a server that signs can forge its own deliveries.
  const sign = (payload: string, timestamp?: number) =>
    Webhook.signatureHeader({ payload, secret, timestamp });

  const run = Effect.fn("run")(function* (label: string, request: Request) {
    const response = yield* handle(request);
    yield* Console.log(`${label}: ${response.status}`);
  });

  yield* run(
    "Signed checkout.session.completed",
    delivery(checkoutCompleted, yield* sign(checkoutCompleted)),
  );
  yield* run(
    "Signed charge.succeeded (unhandled type)",
    delivery(chargeSucceeded, yield* sign(chargeSucceeded)),
  );
  yield* run(
    "Signed customer.subscription.updated that fails to decode",
    delivery(subscriptionWithoutItems, yield* sign(subscriptionWithoutItems)),
  );
  yield* run(
    "Tampered body",
    delivery(
      checkoutCompleted.replace("cus_test_123", "cus_attacker"),
      yield* sign(checkoutCompleted),
    ),
  );
  yield* run("Missing header", delivery(checkoutCompleted, undefined));
  yield* run(
    "Signed with another secret",
    delivery(
      checkoutCompleted,
      yield* Webhook.signatureHeader({
        payload: checkoutCompleted,
        secret: Redacted.make("whsec_some_other_secret"),
      }),
    ),
  );

  // Outside the ±300 s default tolerance: a replayed delivery is refused.
  const tenMinutesAgo = Math.floor((yield* Clock.currentTimeMillis) / 1000) - 600;
  yield* run(
    "Signed ten minutes ago",
    delivery(checkoutCompleted, yield* sign(checkoutCompleted, tenMinutesAgo)),
  );
});

// In production the secret comes from the environment (the default
// `ConfigProvider`); the demo supplies a test secret instead.
const testSecret = ConfigProvider.layer(
  ConfigProvider.fromUnknown({ [SECRET_VAR]: "whsec_test_secret" }),
);

Effect.runPromise(demo().pipe(Effect.provide(testSecret))).catch((error) => {
  console.error("Webhook demo failed:", error);
  process.exit(1);
});
