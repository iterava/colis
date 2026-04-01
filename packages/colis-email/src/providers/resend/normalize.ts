import type { DeliveryError } from "@iterava/colis";
import type { NormalizedEmailAddress } from "../../email/target.ts";
import { EmailError, type EmailErrorShape } from "../../errors/email-error.ts";
import type { ProviderDispatchInput, ProviderDispatchOutcome } from "../types.ts";

export interface ResendTag {
  name: string;
  value: string;
}

export interface ResendSendEmailRequest {
  from?: string;
  to: readonly string[];
  cc?: readonly string[];
  bcc?: readonly string[];
  replyTo?: readonly string[];
  subject: string;
  html?: string;
  text?: string;
  headers?: Readonly<Record<string, string>>;
  tags?: readonly ResendTag[];
}

export interface ResendSendEmailResponse {
  id: string;
}

export interface ResendLikeError {
  message: string;
  name?: string;
  code?: string;
  statusCode?: number;
}

export interface ResendNormalizationOptions {
  observedAt: string;
  provider?: string;
  request?: ResendSendEmailRequest;
  response?: ResendSendEmailResponse;
  error?: unknown;
}

export function toResendSendEmailRequest(input: ProviderDispatchInput): ResendSendEmailRequest {
  return {
    from: input.normalizedTarget.from?.email,
    to: input.normalizedTarget.to.map((entry: NormalizedEmailAddress) => entry.email),
    cc:
      input.normalizedTarget.cc.length > 0
        ? input.normalizedTarget.cc.map((entry: NormalizedEmailAddress) => entry.email)
        : undefined,
    bcc:
      input.normalizedTarget.bcc.length > 0
        ? input.normalizedTarget.bcc.map((entry: NormalizedEmailAddress) => entry.email)
        : undefined,
    replyTo:
      input.normalizedTarget.replyTo.length > 0
        ? input.normalizedTarget.replyTo.map((entry: NormalizedEmailAddress) => entry.email)
        : undefined,
    subject: input.preparedPayload.subject,
    html: input.preparedPayload.html,
    text: input.preparedPayload.text,
    headers: input.preparedPayload.headers,
    tags:
      input.preparedPayload.tags.length > 0
        ? input.preparedPayload.tags.map((tag: string) => ({ name: "tag", value: tag }))
        : undefined,
  };
}

export function normalizeResendSendEmailResponse(
  response: ResendSendEmailResponse,
  options: ResendNormalizationOptions,
): ProviderDispatchOutcome {
  return {
    provider: options.provider ?? "resend",
    status: "accepted",
    externalReference: response.id,
    acceptedAt: options.observedAt,
    diagnostics:
      options.request || options.response
        ? {
            request: options.request,
            response: options.response ?? response,
          }
        : undefined,
  };
}

export function normalizeResendSendEmailError(
  error: ResendLikeError,
  options: ResendNormalizationOptions,
): ProviderDispatchOutcome {
  return {
    provider: options.provider ?? "resend",
    status: "failed",
    failedAt: options.observedAt,
    error: toDeliveryError(error),
    diagnostics: {
      request: options.request,
      error: options.error ?? error,
      providerError: toProviderError(error),
    },
  };
}

function toDeliveryError(error: ResendLikeError): DeliveryError {
  const retryable = (error.statusCode ?? 500) >= 500;
  const code = retryable ? "dispatch_failed" : "dispatch_rejected";

  return {
    phase: "dispatch",
    code,
    message: error.message,
    retryable,
    cause: error,
    details: {
      provider: "resend",
      providerCode: error.code,
      statusCode: error.statusCode,
      name: error.name,
    },
  };
}

function toProviderError(error: ResendLikeError): EmailErrorShape {
  const retryable = (error.statusCode ?? 500) >= 500;

  return new EmailError(error.message, {
    phase: "dispatch",
    code: error.code ?? "RESEND_REQUEST_FAILED",
    retryable,
    details: {
      provider: "resend",
      statusCode: error.statusCode,
      name: error.name,
    },
  });
}
