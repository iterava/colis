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

interface EmailPayload {
  readonly template: "shipment-ready";
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly attachments: readonly { readonly filename: string; readonly contentId: string }[];
}

interface EmailTarget {
  readonly to: readonly string[];
  readonly cc?: readonly string[];
  readonly locale: string;
}

interface PreparedEmailPayload {
  readonly renderedSubject: string;
  readonly mime: Uint8Array;
  readonly providerHints: {
    readonly campaign: string;
  };
}

interface NormalizedEmailTarget {
  readonly addresses: readonly string[];
  readonly locale: string;
}

interface PushPayload {
  readonly title: string;
  readonly body: string;
  readonly deeplink: string;
  readonly collapseKey: string;
}

interface PushTarget {
  readonly deviceToken: Uint8Array;
  readonly platform: "ios" | "android";
  readonly locale: string;
}

interface PreparedPushPayload {
  readonly json: Uint8Array;
  readonly headers: Readonly<Record<string, string>>;
}

interface NormalizedPushTarget {
  readonly endpoint: URL;
  readonly platform: "ios" | "android";
}

function prepareDelivery<TPayload, TTarget, TPreparedPayload, TNormalizedTarget>(input: {
  readonly request: DeliveryRequest<
    TPayload,
    TTarget,
    { readonly tenantId: string; readonly traceId: string }
  >;
  readonly deliveryId: string;
  readonly preparedPayload: TPreparedPayload;
  readonly normalizedTarget: TNormalizedTarget;
  readonly preparedAt: string;
}): PreparedDelivery<
  TPreparedPayload,
  TNormalizedTarget,
  { readonly tenantId: string; readonly traceId: string }
> {
  return {
    deliveryId: input.deliveryId,
    channel: input.request.channel,
    preparedPayload: input.preparedPayload,
    normalizedTarget: input.normalizedTarget,
    metadata: input.request.metadata,
    idempotencyKey: input.request.idempotencyKey,
    preparedAt: input.preparedAt,
  };
}

function recordAttempt(input: {
  readonly deliveryId: string;
  readonly attemptId: string;
  readonly status: DeliveryAttempt["status"];
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly externalReference?: string;
  readonly error?: DeliveryError;
}): DeliveryAttempt {
  return {
    attemptId: input.attemptId,
    deliveryId: input.deliveryId,
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    externalReference: input.externalReference,
    error: input.error,
  };
}

function recordEvent(input: {
  readonly eventId: string;
  readonly deliveryId: string;
  readonly attemptId?: string;
  readonly status: DeliveryEvent["status"];
  readonly occurredAt: string;
  readonly error?: DeliveryError;
}): DeliveryEvent {
  return {
    eventId: input.eventId,
    deliveryId: input.deliveryId,
    attemptId: input.attemptId,
    status: input.status,
    occurredAt: input.occurredAt,
    error: input.error,
  };
}

function buildReceipt(input: {
  readonly deliveryId: string;
  readonly channel: string;
  readonly status: DeliveryReceipt["status"];
  readonly latestAttemptId?: string;
  readonly acceptedAt?: string;
  readonly deliveredAt?: string;
  readonly failedAt?: string;
  readonly canceledAt?: string;
  readonly updatedAt: string;
  readonly error?: DeliveryError;
}): DeliveryReceipt {
  return {
    deliveryId: input.deliveryId,
    channel: input.channel,
    status: input.status,
    latestAttemptId: input.latestAttemptId,
    acceptedAt: input.acceptedAt,
    deliveredAt: input.deliveredAt,
    failedAt: input.failedAt,
    canceledAt: input.canceledAt,
    updatedAt: input.updatedAt,
    error: input.error,
  };
}

test("email-like consumer shape fits the current core lifecycle contracts", () => {
  const request: DeliveryRequest<
    EmailPayload,
    EmailTarget,
    { readonly tenantId: string; readonly traceId: string }
  > = {
    channel: "email",
    payload: {
      template: "shipment-ready",
      subject: "Your package is on the way",
      html: "<strong>Track your order</strong>",
      text: "Track your order",
      attachments: [{ filename: "label.pdf", contentId: "label-1" }],
    },
    target: {
      to: ["customer@example.test"],
      cc: ["ops@example.test"],
      locale: "en-US",
    },
    metadata: {
      tenantId: "tenant_1",
      traceId: "trace_email_1",
    },
    idempotencyKey: "idem_email_1",
  };

  const prepared = prepareDelivery({
    request,
    deliveryId: "del_email_1",
    preparedPayload: {
      renderedSubject: request.payload.subject,
      mime: new Uint8Array([1, 3, 3, 7]),
      providerHints: {
        campaign: "shipment-ready",
      },
    } satisfies PreparedEmailPayload,
    normalizedTarget: {
      addresses: [...request.target.to, ...(request.target.cc ?? [])],
      locale: request.target.locale,
    } satisfies NormalizedEmailTarget,
    preparedAt: "2026-03-24T19:20:00.000Z",
  });

  const acceptedAttempt = recordAttempt({
    deliveryId: prepared.deliveryId,
    attemptId: "att_email_1",
    status: "accepted",
    startedAt: "2026-03-24T19:20:01.000Z",
    completedAt: "2026-03-24T19:20:02.000Z",
    externalReference: "provider-email-1",
  });

  const deliveredEvent = recordEvent({
    eventId: "evt_email_1",
    deliveryId: prepared.deliveryId,
    attemptId: acceptedAttempt.attemptId,
    status: "delivered",
    occurredAt: "2026-03-24T19:20:09.000Z",
  });

  const receipt = buildReceipt({
    deliveryId: prepared.deliveryId,
    channel: prepared.channel,
    status: "delivered",
    latestAttemptId: acceptedAttempt.attemptId,
    acceptedAt: acceptedAttempt.completedAt,
    deliveredAt: deliveredEvent.occurredAt,
    updatedAt: deliveredEvent.occurredAt,
  });

  expect(prepared.channel).toBe("email");
  expect(prepared.metadata?.traceId).toBe("trace_email_1");
  expect(prepared.preparedPayload.providerHints.campaign).toBe("shipment-ready");
  expect(prepared.normalizedTarget.addresses).toEqual([
    "customer@example.test",
    "ops@example.test",
  ]);
  expect(acceptedAttempt.externalReference).toBe("provider-email-1");
  expect(deliveredEvent.attemptId).toBe(acceptedAttempt.attemptId);
  expect(receipt.status).toBe("delivered");
  expect(receipt.deliveredAt).toBe("2026-03-24T19:20:09.000Z");
});

test("push-like consumer shape fits the current core lifecycle contracts", () => {
  const request: DeliveryRequest<
    PushPayload,
    PushTarget,
    { readonly tenantId: string; readonly traceId: string }
  > = {
    channel: "push",
    payload: {
      title: "Shipment ready",
      body: "Open the app to track your package.",
      deeplink: "colis://shipments/ord_123",
      collapseKey: "shipment-ord_123",
    },
    target: {
      deviceToken: new Uint8Array([4, 2, 4, 2]),
      platform: "ios",
      locale: "en-US",
    },
    metadata: {
      tenantId: "tenant_1",
      traceId: "trace_push_1",
    },
    idempotencyKey: "idem_push_1",
  };

  const prepared = prepareDelivery({
    request,
    deliveryId: "del_push_1",
    preparedPayload: {
      json: new TextEncoder().encode(JSON.stringify(request.payload)),
      headers: {
        "apns-collapse-id": request.payload.collapseKey,
      },
    } satisfies PreparedPushPayload,
    normalizedTarget: {
      endpoint: new URL("https://push.example.test/devices/4242"),
      platform: request.target.platform,
    } satisfies NormalizedPushTarget,
    preparedAt: "2026-03-24T19:22:00.000Z",
  });

  const dispatchError: DeliveryError = {
    phase: "dispatch",
    code: "dispatch_failed",
    message: "Push provider timed out.",
    retryable: true,
    details: {
      provider: "mock-push",
      timeoutMs: 5000,
    },
  };

  const failedAttempt = recordAttempt({
    deliveryId: prepared.deliveryId,
    attemptId: "att_push_1",
    status: "failed",
    startedAt: "2026-03-24T19:22:01.000Z",
    completedAt: "2026-03-24T19:22:06.000Z",
    error: dispatchError,
  });

  const failedEvent = recordEvent({
    eventId: "evt_push_1",
    deliveryId: prepared.deliveryId,
    attemptId: failedAttempt.attemptId,
    status: "failed",
    occurredAt: failedAttempt.completedAt!,
    error: dispatchError,
  });

  const receipt = buildReceipt({
    deliveryId: prepared.deliveryId,
    channel: prepared.channel,
    status: "failed",
    latestAttemptId: failedAttempt.attemptId,
    failedAt: failedEvent.occurredAt,
    updatedAt: failedEvent.occurredAt,
    error: dispatchError,
  });

  expect(prepared.channel).toBe("push");
  expect(prepared.preparedPayload.headers["apns-collapse-id"]).toBe("shipment-ord_123");
  expect(prepared.normalizedTarget.endpoint).toBeInstanceOf(URL);
  expect(failedAttempt.error?.retryable).toBe(true);
  expect(failedEvent.error?.phase).toBe("dispatch");
  expect(receipt.error?.code).toBe("dispatch_failed");
  expect(receipt.failedAt).toBe("2026-03-24T19:22:06.000Z");
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

test("normalized errors preserve phase retryability and details across lifecycle records", () => {
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

  const attempt = recordAttempt({
    deliveryId: "del_123",
    attemptId: "att_1",
    status: "failed",
    startedAt: "2026-03-23T20:10:00.000Z",
    completedAt: "2026-03-23T20:10:05.000Z",
    externalReference: "ext_123",
    error,
  });

  const event = recordEvent({
    eventId: "evt_1",
    deliveryId: attempt.deliveryId,
    attemptId: attempt.attemptId,
    status: "failed",
    occurredAt: attempt.completedAt!,
    error,
  });

  const receipt = buildReceipt({
    deliveryId: attempt.deliveryId,
    channel: "sms",
    status: "failed",
    latestAttemptId: attempt.attemptId,
    failedAt: event.occurredAt,
    updatedAt: event.occurredAt,
    error,
  });

  expect(attempt.error).toEqual(error);
  expect(event.error).toEqual(error);
  expect(receipt.error).toEqual(error);
  expect(attempt.error?.phase).toBe("dispatch");
  expect(event.error?.retryable).toBe(true);
  expect(receipt.error?.details).toEqual({
    reason: "over-capacity",
  });
});

test("shared core flow helpers work for both consumer shapes without channel leakage", () => {
  const emailRequest: DeliveryRequest<EmailPayload, EmailTarget> = {
    channel: "email",
    payload: {
      template: "shipment-ready",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
      attachments: [],
    },
    target: {
      to: ["customer@example.test"],
      locale: "en-US",
    },
  };

  const pushRequest: DeliveryRequest<PushPayload, PushTarget> = {
    channel: "push",
    payload: {
      title: "Title",
      body: "Body",
      deeplink: "colis://shipments/ord_999",
      collapseKey: "shipment-ord_999",
    },
    target: {
      deviceToken: new Uint8Array([9, 9, 9]),
      platform: "android",
      locale: "en-US",
    },
  };

  const emailPrepared = prepareDelivery({
    request: {
      ...emailRequest,
      metadata: { tenantId: "tenant_1", traceId: "trace_email_2" },
    },
    deliveryId: "del_shared_email",
    preparedPayload: {
      renderedSubject: "Subject",
      mime: new Uint8Array([1]),
      providerHints: { campaign: "shipment-ready" },
    },
    normalizedTarget: { addresses: ["customer@example.test"], locale: "en-US" },
    preparedAt: "2026-03-24T19:25:00.000Z",
  });

  const pushPrepared = prepareDelivery({
    request: {
      ...pushRequest,
      metadata: { tenantId: "tenant_1", traceId: "trace_push_2" },
    },
    deliveryId: "del_shared_push",
    preparedPayload: { json: new Uint8Array([2]), headers: { urgency: "high" } },
    normalizedTarget: {
      endpoint: new URL("https://push.example.test/devices/999"),
      platform: "android",
    },
    preparedAt: "2026-03-24T19:25:01.000Z",
  });

  const emailAccepted = recordAttempt({
    deliveryId: emailPrepared.deliveryId,
    attemptId: "att_shared_email",
    status: "accepted",
    startedAt: "2026-03-24T19:25:02.000Z",
  });

  const pushAccepted = recordAttempt({
    deliveryId: pushPrepared.deliveryId,
    attemptId: "att_shared_push",
    status: "accepted",
    startedAt: "2026-03-24T19:25:03.000Z",
  });

  const emailReceipt = buildReceipt({
    deliveryId: emailPrepared.deliveryId,
    channel: emailPrepared.channel,
    status: emailAccepted.status,
    latestAttemptId: emailAccepted.attemptId,
    acceptedAt: emailAccepted.startedAt,
    updatedAt: emailAccepted.startedAt,
  });

  const pushReceipt = buildReceipt({
    deliveryId: pushPrepared.deliveryId,
    channel: pushPrepared.channel,
    status: pushAccepted.status,
    latestAttemptId: pushAccepted.attemptId,
    acceptedAt: pushAccepted.startedAt,
    updatedAt: pushAccepted.startedAt,
  });

  expect(emailReceipt.status).toBe("accepted");
  expect(pushReceipt.status).toBe("accepted");
  expect(emailReceipt.channel).toBe("email");
  expect(pushReceipt.channel).toBe("push");
  expect("subject" in emailReceipt).toBe(false);
  expect("deviceToken" in pushReceipt).toBe(false);
});

test("core-owned contract types do not define channel-specific or runtime-specific fields", () => {
  const requestHasNoHtml: HasKey<DeliveryRequest, "html"> = false;
  const requestHasNoText: HasKey<DeliveryRequest, "text"> = false;
  const requestHasNoAttachments: HasKey<DeliveryRequest, "attachments"> = false;
  const requestHasNoFrom: HasKey<DeliveryRequest, "from"> = false;
  const requestHasNoReplyTo: HasKey<DeliveryRequest, "replyTo"> = false;
  const requestHasNoRecipient: HasKey<DeliveryRequest, "recipient"> = false;
  const requestHasNoSubject: HasKey<DeliveryRequest, "subject"> = false;
  const requestHasNoDeviceToken: HasKey<DeliveryRequest, "deviceToken"> = false;
  const preparedHasNoSubject: HasKey<PreparedDelivery, "subject"> = false;
  const preparedHasNoFrom: HasKey<PreparedDelivery, "from"> = false;
  const preparedHasNoApnsTopic: HasKey<PreparedDelivery, "apnsTopic"> = false;
  const requestHasNoQueueId: HasKey<DeliveryRequest, "queueId"> = false;
  const requestHasNoJobId: HasKey<DeliveryRequest, "jobId"> = false;
  const preparedHasNoQueueName: HasKey<PreparedDelivery, "queueName"> = false;
  const preparedHasNoJobId: HasKey<PreparedDelivery, "jobId"> = false;
  const receiptHasNoHtml: HasKey<DeliveryReceipt, "html"> = false;
  const receiptHasNoStoreKey: HasKey<DeliveryReceipt, "storeKey"> = false;
  const receiptHasNoWebhookId: HasKey<DeliveryReceipt, "webhookId"> = false;
  const eventHasNoWebhookId: HasKey<DeliveryEvent, "webhookId"> = false;
  const eventHasNoQueueName: HasKey<DeliveryEvent, "queueName"> = false;
  const attemptHasNoJobId: HasKey<DeliveryAttempt, "jobId"> = false;

  expect([
    requestHasNoHtml,
    requestHasNoText,
    requestHasNoAttachments,
    requestHasNoFrom,
    requestHasNoReplyTo,
    requestHasNoRecipient,
    requestHasNoSubject,
    requestHasNoDeviceToken,
    preparedHasNoSubject,
    preparedHasNoFrom,
    preparedHasNoApnsTopic,
    requestHasNoQueueId,
    requestHasNoJobId,
    preparedHasNoQueueName,
    preparedHasNoJobId,
    receiptHasNoHtml,
    receiptHasNoStoreKey,
    receiptHasNoWebhookId,
    eventHasNoWebhookId,
    eventHasNoQueueName,
    attemptHasNoJobId,
  ]).toEqual([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
});
