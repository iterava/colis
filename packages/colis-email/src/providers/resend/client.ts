import { EmailError } from "../../errors/email-error.ts";
import {
  normalizeResendSendEmailError,
  normalizeResendSendEmailResponse,
  toResendSendEmailRequest,
  type ResendLikeError,
  type ResendSendEmailRequest,
  type ResendSendEmailResponse,
} from "./normalize.ts";
import type { EmailProviderAdapter, ProviderDispatchInput } from "../types.ts";

export interface ResendTransport {
  sendEmail(
    request: ResendSendEmailRequest,
    options?: { idempotencyKey?: string },
  ): Promise<ResendSendEmailResponse>;
}

export interface ResendEmailProviderOptions {
  transport: ResendTransport;
  providerName?: string;
  now?: () => Date;
}

export function createResendEmailProvider(
  options: ResendEmailProviderOptions,
): EmailProviderAdapter {
  const providerName = options.providerName ?? "resend";

  return {
    provider: providerName,
    async dispatch(input: ProviderDispatchInput) {
      const request = toResendSendEmailRequest(input);
      const now = options.now ?? (() => new Date());

      try {
        const response = await options.transport.sendEmail(request, {
          idempotencyKey: input.idempotencyKey,
        });
        const observedAt = now().toISOString();

        return normalizeResendSendEmailResponse(response, {
          provider: providerName,
          observedAt,
          request,
          response,
        });
      } catch (error) {
        const observedAt = now().toISOString();

        return normalizeResendSendEmailError(asResendLikeError(error), {
          provider: providerName,
          observedAt,
          request,
          error,
        });
      }
    },
  };
}

function asResendLikeError(value: unknown): ResendLikeError {
  if (value instanceof Error) {
    const resendError = value as Error & { code?: string; statusCode?: number };

    return {
      message: resendError.message,
      name: resendError.name,
      code: resendError.code,
      statusCode: resendError.statusCode,
    };
  }

  throw new EmailError("Resend transport threw a non-Error value.", {
    phase: "dispatch",
    code: "RESEND_TRANSPORT_INVALID_ERROR",
    retryable: false,
    details: { value },
  });
}
