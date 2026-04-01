import type {
  ResendSendEmailRequest,
  ResendSendEmailResponse,
  ResendTransport,
} from "../../src/providers/resend/index.ts";

export interface RealResendTransportOptions {
  apiKey: string;
  apiBaseUrl?: string;
  idempotencyKey?: string;
}

export function createRealResendTransport(options: RealResendTransportOptions): ResendTransport {
  const apiBaseUrl = options.apiBaseUrl ?? "https://api.resend.com";

  return {
    async sendEmail(
      request: ResendSendEmailRequest,
      transportOptions?: { idempotencyKey?: string },
    ): Promise<ResendSendEmailResponse> {
      const response = await fetch(`${apiBaseUrl}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
          ...((transportOptions?.idempotencyKey ?? options.idempotencyKey)
            ? { "Idempotency-Key": transportOptions?.idempotencyKey ?? options.idempotencyKey }
            : {}),
        },
        body: JSON.stringify(request),
      });

      const payload = await readJson(response);

      if (!response.ok) {
        throw toResendHttpError(response.status, payload);
      }

      if (!isResendSendEmailResponse(payload)) {
        const error = new Error("Resend returned an invalid send-email response.") as Error & {
          code?: string;
          statusCode?: number;
        };
        error.code = "invalid_response";
        error.statusCode = response.status;
        throw error;
      }

      return payload;
    },
  };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function toResendHttpError(
  statusCode: number,
  payload: unknown,
): Error & {
  code?: string;
  statusCode?: number;
} {
  const details = asErrorDetails(payload);
  const error = new Error(details.message) as Error & {
    code?: string;
    statusCode?: number;
  };

  error.code = details.code;
  error.statusCode = statusCode;

  return error;
}

function asErrorDetails(payload: unknown): { message: string; code?: string } {
  if (!payload || typeof payload !== "object") {
    return { message: "Resend request failed." };
  }

  const message = getString(payload, "message") ?? "Resend request failed.";
  const code = getString(payload, "name") ?? getString(payload, "code");

  return { message, code };
}

function getString(payload: object, key: string): string | undefined {
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function isResendSendEmailResponse(payload: unknown): payload is ResendSendEmailResponse {
  return Boolean(
    payload &&
    typeof payload === "object" &&
    typeof (payload as Record<string, unknown>).id === "string",
  );
}
