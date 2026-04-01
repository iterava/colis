import { expect, test } from "vite-plus/test";
import * as colisEmail from "../src/index.ts";
import type {
  DeliveryAttempt,
  DeliveryEvent,
  DeliveryReceipt,
  EmailRequest,
  ProviderDispatchOutcome,
} from "../src/index.ts";

test("exports only provider-neutral package entry points from the root", () => {
  expect(Object.keys(colisEmail).sort()).toEqual([
    "EmailError",
    "dispatchEmailDelivery",
    "prepareEmailDelivery",
  ]);
});

test("does not leak resend-specific helpers from the root entry point", () => {
  expect(colisEmail).not.toHaveProperty("createResendEmailProvider");
  expect(colisEmail).not.toHaveProperty("normalizeResendSendEmailError");
  expect(colisEmail).not.toHaveProperty("normalizeResendSendEmailResponse");
  expect(colisEmail).not.toHaveProperty("toResendSendEmailRequest");
});

test("public types keep email-specific input local while core lifecycle outputs come from colis", () => {
  const request: EmailRequest = {
    target: {
      to: ["user@example.com"],
      from: { email: "sender@example.com", name: "Sender" },
    },
    content: {
      subject: "Boundary",
      text: "hello",
    },
    metadata: {
      source: "test",
    },
  };

  const attempt: DeliveryAttempt = {
    attemptId: "att_123",
    deliveryId: "del_123",
    status: "accepted",
    startedAt: "2026-03-25T14:06:00.000Z",
    completedAt: "2026-03-25T14:06:00.000Z",
  };
  const receipt: DeliveryReceipt = {
    deliveryId: "del_123",
    channel: "email",
    status: "accepted",
    latestAttemptId: "att_123",
    acceptedAt: "2026-03-25T14:06:00.000Z",
    updatedAt: "2026-03-25T14:06:00.000Z",
  };
  const event: DeliveryEvent = {
    eventId: "evt_123",
    deliveryId: "del_123",
    status: "accepted",
    occurredAt: "2026-03-25T14:06:00.000Z",
    attemptId: "att_123",
  };

  expect(attempt.status).toBe("accepted");
  expect(receipt.channel).toBe("email");
  expect(event.status).toBe("accepted");
  expect(request.content.subject).toBe("Boundary");
});

test("resend remains available as an optional provider adapter subpath", async () => {
  const resend = await import("../src/providers/resend/index.ts");

  expect(Object.keys(resend).sort()).toEqual([
    "createResendEmailProvider",
    "normalizeResendSendEmailError",
    "normalizeResendSendEmailResponse",
    "toResendSendEmailRequest",
  ]);
});

test("root provider outcome types stay generic while resend-only helpers stay in the subpath", () => {
  type RootDiagnostics = NonNullable<ProviderDispatchOutcome["diagnostics"]>;

  const diagnostics: RootDiagnostics = {
    request: { any: "provider-request" },
    response: { any: "provider-response" },
  };

  expect(diagnostics.request).toEqual({ any: "provider-request" });
  expect(colisEmail).not.toHaveProperty("ResendSendEmailRequest");
});
