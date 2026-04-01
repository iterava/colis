import { expect, test } from "vite-plus/test";
import { dispatchEmailDelivery, prepareEmailDelivery } from "../src/index.ts";
import { createResendEmailProvider } from "../src/providers/resend/index.ts";
import { createRealResendTransport } from "./support/resend-real-transport.ts";

const INTEGRATION_ENABLE_ENV = "COLIS_EMAIL_INTEGRATION_RESEND";
const REQUIRED_ENV_VARS = [
  "COLIS_EMAIL_INTEGRATION_RESEND_API_KEY",
  "COLIS_EMAIL_INTEGRATION_RESEND_FROM",
  "COLIS_EMAIL_INTEGRATION_RESEND_TO",
] as const;

const enabled = process.env[INTEGRATION_ENABLE_ENV] === "1";
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

if (enabled && missingEnvVars.length > 0) {
  throw new Error(
    `Missing required env vars for the Resend integration path: ${missingEnvVars.join(", ")}`,
  );
}

test.skipIf(!enabled)(
  "sends an email through the real Resend provider path and returns normalized outputs",
  async () => {
    const now = new Date();
    const deliveryId = `email_integration_${now.toISOString().replaceAll(/[-:.]/g, "")}`;
    const idempotencyKey = `colis-email-integration-${deliveryId}`;
    const from = process.env.COLIS_EMAIL_INTEGRATION_RESEND_FROM!;
    const to = process.env.COLIS_EMAIL_INTEGRATION_RESEND_TO!;
    const subjectPrefix =
      process.env.COLIS_EMAIL_INTEGRATION_SUBJECT_PREFIX ?? "[colis-email integration]";
    const apiBaseUrl = process.env.COLIS_EMAIL_INTEGRATION_RESEND_API_BASE_URL;

    const prepared = prepareEmailDelivery({
      target: {
        from,
        to: [to],
      },
      content: {
        subject: `${subjectPrefix} ${deliveryId}`,
        text: `colis-email resend integration test\n\ndeliveryId=${deliveryId}`,
        headers: {
          "X-Colis-Email-Integration": "1",
        },
        tags: ["colis-email-integration"],
      },
      metadata: {
        test: "resend-integration",
      },
      idempotencyKey,
    });
    const provider = createResendEmailProvider({
      transport: createRealResendTransport({
        apiKey: process.env.COLIS_EMAIL_INTEGRATION_RESEND_API_KEY!,
        apiBaseUrl,
        idempotencyKey,
      }),
    });

    const result = await dispatchEmailDelivery(prepared, provider);

    expect(prepared).toMatchObject({
      deliveryId,
      channel: "email",
      normalizedTarget: {
        from: { email: from.toLowerCase() },
        to: [{ email: to.toLowerCase() }],
      },
      preparedPayload: {
        subject: `${subjectPrefix} ${deliveryId}`,
        text: `colis-email resend integration test\n\ndeliveryId=${deliveryId}`,
        headers: {
          "X-Colis-Email-Integration": "1",
        },
        tags: ["colis-email-integration"],
      },
      metadata: {
        test: "resend-integration",
      },
      idempotencyKey,
    });
    expect(result.outcome).toMatchObject({
      provider: "resend",
      status: "accepted",
      externalReference: expect.any(String),
      acceptedAt: expect.any(String),
      diagnostics: {
        request: {
          from: from.toLowerCase(),
          to: [to.toLowerCase()],
          subject: `${subjectPrefix} ${deliveryId}`,
          text: `colis-email resend integration test\n\ndeliveryId=${deliveryId}`,
          headers: {
            "X-Colis-Email-Integration": "1",
          },
          tags: [{ name: "tag", value: "colis-email-integration" }],
        },
        response: {
          id: expect.any(String),
        },
      },
    });
    expect(result.attempt).toMatchObject({
      deliveryId,
      status: "accepted",
      externalReference: result.outcome.externalReference,
      startedAt: expect.any(String),
      completedAt: expect.any(String),
    });
    expect(result.receipt).toMatchObject({
      deliveryId,
      channel: "email",
      status: "accepted",
      latestAttemptId: result.attempt.attemptId,
      acceptedAt: result.outcome.acceptedAt,
      updatedAt: expect.any(String),
    });
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      deliveryId,
      attemptId: result.attempt.attemptId,
      status: "accepted",
      occurredAt: expect.any(String),
    });
  },
);
