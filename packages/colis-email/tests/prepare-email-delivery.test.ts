import { expect, test } from "vite-plus/test";
import { EmailError, prepareEmailDelivery } from "../src/index.ts";

test("prepares a normalized email delivery shape", () => {
  const prepared = prepareEmailDelivery(
    {
      target: {
        to: ["User@Example.com", "user@example.com"],
        cc: [{ email: "cc@example.com", name: "CC" }],
        from: { email: " sender@example.com ", name: " Sender " },
      },
      content: {
        subject: "  Hello world  ",
        html: " <strong>Hello</strong> ",
        tags: ["welcome", "welcome", "transactional"],
      },
      metadata: {
        campaign: "onboarding",
      },
      idempotencyKey: "idem_123",
    },
    {
      createDeliveryId: () => "del_123",
      now: () => new Date("2026-03-25T14:05:00.000Z"),
    },
  );

  expect(prepared).toEqual({
    deliveryId: "del_123",
    channel: "email",
    normalizedTarget: {
      to: [{ email: "user@example.com" }],
      cc: [{ email: "cc@example.com", name: "CC" }],
      bcc: [],
      from: { email: "sender@example.com", name: "Sender" },
      replyTo: [],
    },
    preparedPayload: {
      subject: "Hello world",
      html: "<strong>Hello</strong>",
      text: undefined,
      headers: {},
      tags: ["welcome", "transactional"],
    },
    metadata: {
      campaign: "onboarding",
    },
    idempotencyKey: "idem_123",
    preparedAt: "2026-03-25T14:05:00.000Z",
  });
});

test("rejects requests without a deliverable body", () => {
  expect(() =>
    prepareEmailDelivery({
      target: {
        to: ["user@example.com"],
      },
      content: {
        subject: "No body",
      },
    }),
  ).toThrowError(EmailError);
});

test("uses default preparation values and drops empty optional content", () => {
  const prepared = prepareEmailDelivery(
    {
      target: {
        to: ["Primary@example.com", { email: "SECOND@example.com", name: "  " }],
        bcc: ["hidden@example.com", "HIDDEN@example.com"],
        replyTo: ["reply@example.com"],
      },
      content: {
        subject: " Defaults ",
        html: "   ",
        text: " Hello ",
        headers: {
          "X-Trace": "abc123",
        },
        tags: [" alpha ", "alpha", " ", "beta"],
      },
    },
    {
      now: () => new Date("2026-03-26T00:00:01.234Z"),
    },
  );

  expect(prepared).toEqual({
    deliveryId: "email_20260326T000001234Z",
    channel: "email",
    normalizedTarget: {
      to: [{ email: "primary@example.com" }, { email: "second@example.com" }],
      cc: [],
      bcc: [{ email: "hidden@example.com" }],
      from: undefined,
      replyTo: [{ email: "reply@example.com" }],
    },
    preparedPayload: {
      subject: "Defaults",
      html: undefined,
      text: "Hello",
      headers: {
        "X-Trace": "abc123",
      },
      tags: ["alpha", "alpha", "beta"],
    },
    metadata: undefined,
    idempotencyKey: undefined,
    preparedAt: "2026-03-26T00:00:01.234Z",
  });
});

test("rejects requests with an empty target.to list after normalization", () => {
  expect(() =>
    prepareEmailDelivery({
      target: {
        to: ["   "],
      },
      content: {
        subject: "Missing recipients",
        text: "hello",
      },
    }),
  ).toThrowError(
    expect.objectContaining({
      name: "EmailError",
      code: "EMAIL_ADDRESS_INVALID",
      phase: "prepare",
    }),
  );
});

test("rejects requests without a subject", () => {
  expect(() =>
    prepareEmailDelivery({
      target: {
        to: ["user@example.com"],
      },
      content: {
        subject: "   ",
        text: "hello",
      },
    }),
  ).toThrowError(
    expect.objectContaining({
      name: "EmailError",
      code: "EMAIL_SUBJECT_REQUIRED",
      phase: "prepare",
    }),
  );
});

test("rejects requests with an invalid from address", () => {
  expect(() =>
    prepareEmailDelivery({
      target: {
        to: ["user@example.com"],
        from: {
          email: "   ",
          name: "Sender",
        },
      },
      content: {
        subject: "Invalid from",
        text: "hello",
      },
    }),
  ).toThrowError(
    expect.objectContaining({
      name: "EmailError",
      code: "EMAIL_ADDRESS_INVALID",
      phase: "prepare",
      details: expect.objectContaining({
        field: "target.from",
      }),
    }),
  );
});
