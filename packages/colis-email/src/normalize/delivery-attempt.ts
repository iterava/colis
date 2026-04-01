import type { DeliveryAttempt } from "@iterava/colis";
import type { ProviderDispatchOutcome } from "../providers/types.ts";

export function normalizeDeliveryAttempt(input: {
  attemptId: string;
  deliveryId: string;
  outcome: ProviderDispatchOutcome;
  startedAt: string;
  completedAt: string;
}): DeliveryAttempt {
  return {
    attemptId: input.attemptId,
    deliveryId: input.deliveryId,
    status: input.outcome.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    externalReference: input.outcome.externalReference,
    error: input.outcome.error,
  };
}
