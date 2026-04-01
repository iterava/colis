import type { DeliveryError, DeliveryStatus, PreparedDelivery } from "@iterava/colis";
import type { NormalizedEmailContent } from "../email/content.ts";
import type { EmailMetadata } from "../email/request.ts";
import type { NormalizedEmailTarget } from "../email/target.ts";
import type { EmailErrorShape } from "../errors/email-error.ts";

export type EmailDeliveryStatus = Extract<DeliveryStatus, "accepted" | "delivered" | "failed">;
export type ProviderDispatchInput = PreparedDelivery<
  NormalizedEmailContent,
  NormalizedEmailTarget,
  EmailMetadata
>;

export interface ProviderDispatchDiagnostics {
  request?: unknown;
  response?: unknown;
  error?: unknown;
  providerError?: EmailErrorShape;
}

export interface ProviderDispatchOutcome {
  provider: string;
  status: EmailDeliveryStatus;
  externalReference?: string;
  acceptedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  error?: DeliveryError;
  diagnostics?: ProviderDispatchDiagnostics;
}

export interface EmailProviderAdapter {
  readonly provider: string;
  dispatch(input: ProviderDispatchInput): Promise<ProviderDispatchOutcome>;
}
