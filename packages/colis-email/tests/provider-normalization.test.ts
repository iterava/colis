import { expect, test } from "vite-plus/test";
import {
  createResendEmailProvider,
  normalizeResendSendEmailError,
  normalizeResendSendEmailResponse,
  toResendSendEmailRequest,
} from "../src/providers/resend/index.ts";

test("maps prepared provider input into resend request shape at the adapter edge", () => {
  const request = toResendSendEmailRequest({
    deliveryId: "del_123",
    channel: "email",
    normalizedTarget: {
      to: [{ email: "user@example.com" }],
      cc: [{ email: "cc@example.com" }],
      bcc: [],
      from: { email: "sender@example.com" },
      replyTo: [{ email: "reply@example.com" }],
    },
    preparedPayload: {
      subject: "Hello",
      html: "<p>Hello</p>",
      text: "Hello",
      headers: {
        "X-Test": "true",
      },
      tags: ["welcome"],
    },
    metadata: {},
    preparedAt: "2026-03-25T14:05:00.000Z",
  });

  expect(request).toEqual({
    from: "sender@example.com",
    to: ["user@example.com"],
    cc: ["cc@example.com"],
    bcc: undefined,
    replyTo: ["reply@example.com"],
    subject: "Hello",
    html: "<p>Hello</p>",
    text: "Hello",
    headers: {
      "X-Test": "true",
    },
    tags: [{ name: "tag", value: "welcome" }],
  });
});

test("normalizes resend responses into provider-neutral outcomes", () => {
  const accepted = normalizeResendSendEmailResponse(
    { id: "re_123" },
    {
      observedAt: "2026-03-25T14:06:00.000Z",
      request: {
        to: ["user@example.com"],
        subject: "Hello",
      },
      response: { id: "re_123" },
    },
  );
  const failed = normalizeResendSendEmailError(
    {
      message: "invalid API key",
      code: "unauthorized",
      statusCode: 401,
    },
    {
      observedAt: "2026-03-25T14:07:00.000Z",
      request: {
        to: ["user@example.com"],
        subject: "Hello",
      },
      error: {
        message: "invalid API key",
        code: "unauthorized",
        statusCode: 401,
      },
    },
  );

  expect(accepted).toEqual({
    provider: "resend",
    status: "accepted",
    externalReference: "re_123",
    acceptedAt: "2026-03-25T14:06:00.000Z",
    diagnostics: {
      request: {
        to: ["user@example.com"],
        subject: "Hello",
      },
      response: { id: "re_123" },
    },
  });
  expect(failed.status).toBe("failed");
  expect(failed.error).toMatchObject({
    phase: "dispatch",
    code: "dispatch_rejected",
    retryable: false,
  });
  expect(failed.diagnostics).toMatchObject({
    request: {
      to: ["user@example.com"],
      subject: "Hello",
    },
    error: {
      message: "invalid API key",
      code: "unauthorized",
      statusCode: 401,
    },
  });
  expect(failed.diagnostics?.providerError).toMatchObject({
    code: "unauthorized",
    retryable: false,
  });
});

test("omits optional resend request fields when the prepared input does not define them", () => {
  const request = toResendSendEmailRequest({
    deliveryId: "del_minimal",
    channel: "email",
    normalizedTarget: {
      to: [{ email: "user@example.com" }],
      cc: [],
      bcc: [],
      from: undefined,
      replyTo: [],
    },
    preparedPayload: {
      subject: "Hello",
      html: undefined,
      text: "Plain text",
      headers: {},
      tags: [],
    },
    metadata: undefined,
    preparedAt: "2026-03-26T00:00:00.000Z",
  });

  expect(request).toEqual({
    from: undefined,
    to: ["user@example.com"],
    cc: undefined,
    bcc: undefined,
    replyTo: undefined,
    subject: "Hello",
    html: undefined,
    text: "Plain text",
    headers: {},
    tags: undefined,
  });
});

test("maps bcc recipients and falls back the raw response into diagnostics when no override is supplied", () => {
  const request = toResendSendEmailRequest({
    deliveryId: "del_bcc",
    channel: "email",
    normalizedTarget: {
      to: [{ email: "user@example.com" }],
      cc: [],
      bcc: [{ email: "hidden@example.com" }],
      from: undefined,
      replyTo: [],
    },
    preparedPayload: {
      subject: "Hello",
      html: undefined,
      text: "Plain text",
      headers: {},
      tags: [],
    },
    metadata: undefined,
    preparedAt: "2026-03-26T00:09:00.000Z",
  });

  expect(request.bcc).toEqual(["hidden@example.com"]);
  expect(
    normalizeResendSendEmailResponse(
      { id: "re_fallback" },
      {
        observedAt: "2026-03-26T00:09:30.000Z",
        request,
      },
    ),
  ).toEqual({
    provider: "resend",
    status: "accepted",
    externalReference: "re_fallback",
    acceptedAt: "2026-03-26T00:09:30.000Z",
    diagnostics: {
      request,
      response: { id: "re_fallback" },
    },
  });
});

test("uses fallback resend defaults when response diagnostics are omitted", () => {
  expect(
    normalizeResendSendEmailResponse(
      { id: "re_default" },
      {
        observedAt: "2026-03-26T00:10:00.000Z",
        provider: "custom-resend",
      },
    ),
  ).toEqual({
    provider: "custom-resend",
    status: "accepted",
    externalReference: "re_default",
    acceptedAt: "2026-03-26T00:10:00.000Z",
    diagnostics: undefined,
  });
});

test("classifies retryable resend failures and uses default provider error codes", () => {
  const failed = normalizeResendSendEmailError(
    {
      message: "temporary outage",
      name: "ResendError",
    },
    {
      observedAt: "2026-03-26T00:11:00.000Z",
      provider: "custom-resend",
    },
  );

  expect(failed).toMatchObject({
    provider: "custom-resend",
    status: "failed",
    failedAt: "2026-03-26T00:11:00.000Z",
    error: {
      code: "dispatch_failed",
      retryable: true,
      details: {
        provider: "resend",
        providerCode: undefined,
        statusCode: undefined,
        name: "ResendError",
      },
    },
    diagnostics: {
      request: undefined,
      error: {
        message: "temporary outage",
        name: "ResendError",
      },
      providerError: {
        code: "RESEND_REQUEST_FAILED",
        retryable: true,
        details: {
          provider: "resend",
          statusCode: undefined,
          name: "ResendError",
        },
      },
    },
  });
});

test("rejects resend provider dispatches when the transport throws a non-Error value", async () => {
  const provider = createResendEmailProvider({
    transport: {
      async sendEmail() {
        throw "boom";
      },
    },
  });

  await expect(
    provider.dispatch({
      deliveryId: "del_789",
      channel: "email",
      normalizedTarget: {
        to: [{ email: "user@example.com" }],
        cc: [],
        bcc: [],
        from: undefined,
        replyTo: [],
      },
      preparedPayload: {
        subject: "Hello",
        html: undefined,
        text: "hello",
        headers: {},
        tags: [],
      },
      metadata: undefined,
      preparedAt: "2026-03-26T00:12:00.000Z",
    }),
  ).rejects.toMatchObject({
    name: "EmailError",
    phase: "dispatch",
    code: "RESEND_TRANSPORT_INVALID_ERROR",
    retryable: false,
    details: {
      value: "boom",
    },
  });
});
