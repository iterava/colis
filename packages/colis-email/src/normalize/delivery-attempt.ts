import type { DeliveryAttempt } from "@iterava/colis";
import type { ProviderDispatchOutcome } from "../providers/types.ts";

export function normalizeDeliveryAttempt(input: {
  attemptId: string;
  deliveryId: string;
  outcome: ProviderDispatchOutcome;
  occurredAt: string;
}): DeliveryAttempt {
  return {
    attemptId: input.attemptId,
    deliveryId: input.deliveryId,
    status: input.outcome.status,
    startedAt: input.occurredAt,
    completedAt: input.occurredAt,
    externalReference: input.outcome.externalReference,
    error: input.outcome.error,
  };
}
