import type { DeliveryMetadata, DeliveryRequest } from "@iterava/colis";
import type { EmailContent } from "./content.ts";
import type { EmailTarget } from "./target.ts";

export interface EmailMetadata extends DeliveryMetadata {
  readonly [key: string]: string;
}

export interface EmailRequest {
  target: EmailTarget;
  content: EmailContent;
  metadata?: EmailMetadata;
  idempotencyKey?: string;
}

export type CoreEmailDeliveryRequest = DeliveryRequest<EmailContent, EmailTarget, EmailMetadata>;

export function toCoreEmailDeliveryRequest(request: EmailRequest): CoreEmailDeliveryRequest {
  return {
    channel: "email",
    payload: request.content,
    target: request.target,
    metadata: request.metadata,
    idempotencyKey: request.idempotencyKey,
  };
}
