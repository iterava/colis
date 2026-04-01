import { expect, test } from "vite-plus/test";
import type {
  DeliveryAttempt,
  DeliveryEvent,
  DeliveryMetadata,
  DeliveryReceipt,
  DeliveryRequest,
  PreparedDelivery,
} from "../src";

interface EmailPayload {
  readonly template: "shipment-ready";
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

interface EmailTarget {
  readonly to: readonly string[];
  readonly cc?: readonly string[];
  readonly locale: string;
}

interface EmailMetadata extends DeliveryMetadata {
  readonly tenantId: string;
  readonly traceId: string;
}

interface PreparedEmailPayload {
  readonly renderedSubject: string;
  readonly mime: Uint8Array;
}

interface NormalizedEmailTarget {
  readonly addresses: readonly string[];
  readonly locale: string;
}

type EmailRequest = DeliveryRequest<EmailPayload, EmailTarget, EmailMetadata>;
type PreparedEmailDelivery = PreparedDelivery<
  PreparedEmailPayload,
  NormalizedEmailTarget,
  EmailMetadata
>;

interface SendResult {
  readonly attempt: DeliveryAttempt;
  readonly event: DeliveryEvent;
  readonly receipt: DeliveryReceipt;
}

interface ConsumerPrototype<
  TRequest extends DeliveryRequest<unknown, unknown, DeliveryMetadata>,
  TPrepared extends PreparedDelivery<unknown, unknown, DeliveryMetadata>,
> {
  readonly prepare: (request: TRequest) => TPrepared;
  readonly send: (prepared: TPrepared) => SendResult;
}

function createEmailPrototype(): ConsumerPrototype<EmailRequest, PreparedEmailDelivery> {
  return {
    prepare(request) {
      return {
        deliveryId: `del_${request.metadata?.traceId ?? "unknown"}`,
        channel: request.channel,
        preparedPayload: {
          renderedSubject: `[${request.target.locale}] ${request.payload.subject}`,
          mime: new TextEncoder().encode(request.payload.html),
        },
        normalizedTarget: {
          addresses: [...request.target.to, ...(request.target.cc ?? [])],
          locale: request.target.locale,
        },
        metadata: request.metadata,
        idempotencyKey: request.idempotencyKey,
        preparedAt: "2026-03-24T20:00:00.000Z",
      };
    },
    send(prepared) {
      const attempt: DeliveryAttempt = {
        attemptId: `att_${prepared.deliveryId}`,
        deliveryId: prepared.deliveryId,
        status: "accepted",
        startedAt: "2026-03-24T20:00:01.000Z",
        completedAt: "2026-03-24T20:00:02.000Z",
        externalReference: "mock-email-provider-1",
      };

      const event: DeliveryEvent = {
        eventId: `evt_${prepared.deliveryId}`,
        deliveryId: prepared.deliveryId,
        attemptId: attempt.attemptId,
        status: "delivered",
        occurredAt: "2026-03-24T20:00:05.000Z",
      };

      const receipt: DeliveryReceipt = {
        deliveryId: prepared.deliveryId,
        channel: prepared.channel,
        status: "delivered",
        latestAttemptId: attempt.attemptId,
        acceptedAt: attempt.completedAt,
        deliveredAt: event.occurredAt,
        updatedAt: event.occurredAt,
      };

      return { attempt, event, receipt };
    },
  };
}

function executePrototype<
  TRequest extends DeliveryRequest<unknown, unknown, DeliveryMetadata>,
  TPrepared extends PreparedDelivery<unknown, unknown, DeliveryMetadata>,
>(
  prototype: ConsumerPrototype<TRequest, TPrepared>,
  request: TRequest,
): {
  readonly prepared: TPrepared;
  readonly result: SendResult;
} {
  const prepared = prototype.prepare(request);
  const result = prototype.send(prepared);
  return { prepared, result };
}

test("phase 3 email-like prototype fits plain prepare and send function contracts", () => {
  const prototype = createEmailPrototype();
  const request: EmailRequest = {
    channel: "email",
    payload: {
      template: "shipment-ready",
      subject: "Your package is ready",
      html: "<strong>Ready</strong>",
      text: "Ready",
    },
    target: {
      to: ["customer@example.test"],
      cc: ["ops@example.test"],
      locale: "en-US",
    },
    metadata: {
      tenantId: "tenant_1",
      traceId: "trace_123",
    },
    idempotencyKey: "idem_123",
  };

  const { prepared, result } = executePrototype(prototype, request);

  expect(prepared.deliveryId).toBe("del_trace_123");
  expect(prepared.preparedPayload.renderedSubject).toBe("[en-US] Your package is ready");
  expect(prepared.normalizedTarget.addresses).toEqual([
    "customer@example.test",
    "ops@example.test",
  ]);
  expect(result.attempt.externalReference).toBe("mock-email-provider-1");
  expect(result.event.attemptId).toBe(result.attempt.attemptId);
  expect(result.receipt.channel).toBe("email");
  expect(result.receipt.status).toBe("delivered");
});

test("phase 3 prototype pressure does not require a core DeliveryPreparer or DeliverySender interface", () => {
  const prototype = createEmailPrototype();
  const request: EmailRequest = {
    channel: "email",
    payload: {
      template: "shipment-ready",
      subject: "Status update",
      html: "<p>Status update</p>",
      text: "Status update",
    },
    target: {
      to: ["customer@example.test"],
      locale: "en-US",
    },
    metadata: {
      tenantId: "tenant_2",
      traceId: "trace_456",
    },
  };

  const prepared = prototype.prepare(request);
  const result = prototype.send(prepared);

  expect(prepared.metadata?.tenantId).toBe("tenant_2");
  expect(prepared.idempotencyKey).toBeUndefined();
  expect(result.receipt.latestAttemptId).toBe(result.attempt.attemptId);
  expect(result.receipt.deliveredAt).toBe(result.event.occurredAt);
  expect(result.receipt.deliveryId).toBe(prepared.deliveryId);
});
