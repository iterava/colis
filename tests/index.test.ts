import { expect, test } from "vite-plus/test";
import type {
  DeliveryAttempt,
  DeliveryError,
  DeliveryEvent,
  DeliveryReceipt,
  DeliveryRequest,
  PreparedDelivery,
} from "../src";

type HasKey<T, TKey extends PropertyKey> = TKey extends keyof T ? true : false;

test("core contracts accept opaque non-email payload and target shapes", () => {
  const request: DeliveryRequest<
    { templateId: number; variables: { orderId: string } },
    { deviceToken: Uint8Array; locale: string }
  > = {
    channel: "push",
    payload: {
      templateId: 42,
      variables: {
        orderId: "ord_123",
      },
    },
    target: {
      deviceToken: new Uint8Array([1, 2, 3]),
      locale: "en-US",
    },
    metadata: {
      tenantId: "tenant_1",
      traceId: "trace_1",
    },
    idempotencyKey: "idem_1",
  };

  const prepared: PreparedDelivery<
    { templateRef: string; body: Uint8Array },
    { endpoint: URL; tags: string[] }
  > = {
    deliveryId: "del_123",
    channel: request.channel,
    preparedPayload: {
      templateRef: "push:shipment-ready",
      body: new Uint8Array([9, 8, 7]),
    },
    normalizedTarget: {
      endpoint: new URL("https://example.test/device/abc"),
      tags: ["ios", "beta"],
    },
    metadata: request.metadata,
    idempotencyKey: request.idempotencyKey,
    preparedAt: "2026-03-23T20:09:00.000Z",
  };

  expect(request.payload).toEqual({
    templateId: 42,
    variables: {
      orderId: "ord_123",
    },
  });
  expect(request.target).toEqual({
    deviceToken: new Uint8Array([1, 2, 3]),
    locale: "en-US",
  });
  expect(prepared.normalizedTarget.endpoint).toBeInstanceOf(URL);
  expect(prepared.preparedPayload.body).toBeInstanceOf(Uint8Array);
});

test("core-owned contract types do not define email-shaped fields", () => {
  const requestHasNoSubject: HasKey<DeliveryRequest, "subject"> = false;
  const requestHasNoHtml: HasKey<DeliveryRequest, "html"> = false;
  const requestHasNoText: HasKey<DeliveryRequest, "text"> = false;
  const requestHasNoAttachments: HasKey<DeliveryRequest, "attachments"> = false;
  const requestHasNoFrom: HasKey<DeliveryRequest, "from"> = false;
  const requestHasNoReplyTo: HasKey<DeliveryRequest, "replyTo"> = false;
  const preparedHasNoSubject: HasKey<PreparedDelivery, "subject"> = false;
  const receiptHasNoHtml: HasKey<DeliveryReceipt, "html"> = false;

  expect([
    requestHasNoSubject,
    requestHasNoHtml,
    requestHasNoText,
    requestHasNoAttachments,
    requestHasNoFrom,
    requestHasNoReplyTo,
    preparedHasNoSubject,
    receiptHasNoHtml,
  ]).toEqual([false, false, false, false, false, false, false, false]);
});

test("delivery receipt and delivery event remain distinct models", () => {
  const receipt: DeliveryReceipt = {
    deliveryId: "del_123",
    channel: "sms",
    status: "delivered",
    latestAttemptId: "att_2",
    acceptedAt: "2026-03-23T20:10:00.000Z",
    deliveredAt: "2026-03-23T20:11:00.000Z",
    updatedAt: "2026-03-23T20:11:00.000Z",
  };

  const event: DeliveryEvent = {
    eventId: "evt_9",
    deliveryId: receipt.deliveryId,
    attemptId: receipt.latestAttemptId,
    status: "delivered",
    occurredAt: receipt.deliveredAt!,
  };

  expect("updatedAt" in receipt).toBe(true);
  expect("occurredAt" in event).toBe(true);
  expect("updatedAt" in event).toBe(false);
  expect("eventId" in receipt).toBe(false);
});

test("normalized errors include phase and retryability", () => {
  const error: DeliveryError = {
    phase: "dispatch",
    code: "dispatch_failed",
    message: "Temporary downstream refusal.",
    retryable: true,
    cause: { status: 503 },
    details: {
      reason: "over-capacity",
    },
  };

  const attempt: DeliveryAttempt = {
    attemptId: "att_1",
    deliveryId: "del_123",
    status: "failed",
    startedAt: "2026-03-23T20:10:00.000Z",
    completedAt: "2026-03-23T20:10:05.000Z",
    externalReference: "ext_123",
    error,
  };

  expect(attempt.error?.phase).toBe("dispatch");
  expect(attempt.error?.retryable).toBe(true);
  expect(attempt.error?.details).toEqual({
    reason: "over-capacity",
  });
});

test("public api does not imply queue, job, store, or webhook semantics", () => {
  const requestHasNoQueueId: HasKey<DeliveryRequest, "queueId"> = false;
  const requestHasNoJobId: HasKey<DeliveryRequest, "jobId"> = false;
  const preparedHasNoQueueName: HasKey<PreparedDelivery, "queueName"> = false;
  const preparedHasNoJobId: HasKey<PreparedDelivery, "jobId"> = false;
  const attemptHasNoJobId: HasKey<DeliveryAttempt, "jobId"> = false;
  const receiptHasNoStoreKey: HasKey<DeliveryReceipt, "storeKey"> = false;
  const eventHasNoWebhookId: HasKey<DeliveryEvent, "webhookId"> = false;

  expect([
    requestHasNoQueueId,
    requestHasNoJobId,
    preparedHasNoQueueName,
    preparedHasNoJobId,
    attemptHasNoJobId,
    receiptHasNoStoreKey,
    eventHasNoWebhookId,
  ]).toEqual([false, false, false, false, false, false, false]);
});
