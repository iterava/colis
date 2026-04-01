import { expect, test } from "vite-plus/test";
import { EmailError, dispatchEmailDelivery, prepareEmailDelivery } from "../src/index.ts";
import { createResendEmailProvider } from "../src/providers/resend/index.ts";

test("dispatches a prepared email through a provider adapter", async () => {
  const provider = createResendEmailProvider({
    now: () => new Date("2026-03-25T14:06:00.000Z"),
    transport: {
      async sendEmail() {
        return { id: "re_123" };
      },
    },
  });
  const prepared = prepareEmailDelivery(
    {
      target: {
        to: ["user@example.com"],
      },
      content: {
        subject: "Dispatch",
        text: "hello",
      },
    },
    {
      createDeliveryId: () => "del_456",
      now: () => new Date("2026-03-25T14:05:00.000Z"),
    },
  );

  const result = await dispatchEmailDelivery(prepared, provider, {
    createAttemptId: () => "att_456",
    now: () => new Date("2026-03-25T14:06:00.000Z"),
  });

  expect(result).toMatchObject({
    attempt: {
      attemptId: "att_456",
      deliveryId: "del_456",
      status: "accepted",
      startedAt: "2026-03-25T14:06:00.000Z",
      completedAt: "2026-03-25T14:06:00.000Z",
      externalReference: "re_123",
    },
    receipt: {
      deliveryId: "del_456",
      latestAttemptId: "att_456",
      channel: "email",
      status: "accepted",
      acceptedAt: "2026-03-25T14:06:00.000Z",
      updatedAt: "2026-03-25T14:06:00.000Z",
    },
    events: [
      {
        eventId: "att_456_accepted",
        deliveryId: "del_456",
        attemptId: "att_456",
        status: "accepted",
      },
    ],
    outcome: {
      provider: "resend",
      externalReference: "re_123",
      diagnostics: {
        request: {
          from: undefined,
          to: ["user@example.com"],
          cc: undefined,
          bcc: undefined,
          replyTo: undefined,
          subject: "Dispatch",
          html: undefined,
          text: "hello",
          headers: {},
          tags: undefined,
        },
        response: {
          id: "re_123",
        },
      },
    },
  });
});

test("surfaces normalized provider failures without throwing for known adapter errors", async () => {
  const provider = createResendEmailProvider({
    transport: {
      async sendEmail() {
        const error = new Error("temporary outage") as Error & {
          code?: string;
          statusCode?: number;
        };
        error.code = "rate_limit";
        error.statusCode = 503;
        throw error;
      },
    },
    now: () => new Date("2026-03-25T14:07:00.000Z"),
  });
  const prepared = prepareEmailDelivery({
    target: {
      to: ["user@example.com"],
    },
    content: {
      subject: "Dispatch failure",
      text: "hello",
    },
  });

  const result = await dispatchEmailDelivery(prepared, provider, {
    createAttemptId: () => "att_failed",
    now: () => new Date("2026-03-25T14:07:00.000Z"),
  });

  expect(result.attempt.status).toBe("failed");
  expect(result.attempt.error).toMatchObject({
    phase: "dispatch",
    code: "dispatch_failed",
    retryable: true,
  });
  expect(result.outcome.diagnostics).toMatchObject({
    request: {
      from: undefined,
      to: ["user@example.com"],
      cc: undefined,
      bcc: undefined,
      replyTo: undefined,
      subject: "Dispatch failure",
      html: undefined,
      text: "hello",
      headers: {},
      tags: undefined,
    },
    error: expect.objectContaining({
      message: "temporary outage",
    }),
  });
  expect(result.outcome.diagnostics?.providerError).toMatchObject({
    code: "rate_limit",
    retryable: true,
  });
  expect(result.events[0]?.status).toBe("failed");
  expect(result.receipt).not.toHaveProperty("diagnostics");
  expect(result.attempt).not.toHaveProperty("diagnostics");
  expect(result.events[0]).not.toHaveProperty("diagnostics");
});

test("preserves an existing normalized email error thrown by the provider", async () => {
  const prepared = prepareEmailDelivery({
    target: {
      to: ["user@example.com"],
    },
    content: {
      subject: "Dispatch error",
      text: "hello",
    },
  });
  const error = new EmailError("Provider rejected request.", {
    phase: "dispatch",
    code: "EMAIL_PROVIDER_REJECTED",
    retryable: false,
    details: { provider: "test-provider" },
  });

  await expect(
    dispatchEmailDelivery(prepared, {
      provider: "test-provider",
      async dispatch() {
        throw error;
      },
    }),
  ).rejects.toBe(error);
});

test("wraps unexpected provider throws without leaking provider diagnostics into core outputs", async () => {
  const prepared = prepareEmailDelivery({
    target: {
      to: ["user@example.com"],
    },
    content: {
      subject: "Unexpected dispatch error",
      text: "hello",
    },
  });

  await expect(
    dispatchEmailDelivery(prepared, {
      provider: "test-provider",
      async dispatch() {
        throw new Error("boom");
      },
    }),
  ).rejects.toMatchObject({
    name: "EmailError",
    phase: "dispatch",
    code: "EMAIL_PROVIDER_DISPATCH_FAILED",
    retryable: true,
    details: { provider: "test-provider" },
  });
});
