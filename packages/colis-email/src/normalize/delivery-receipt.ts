import type { DeliveryReceipt } from "@iterava/colis";
import type { ProviderDispatchOutcome } from "../providers/types.ts";

export function normalizeDeliveryReceipt(input: {
  attemptId: string;
  deliveryId: string;
  outcome: ProviderDispatchOutcome;
  occurredAt: string;
}): DeliveryReceipt {
  return {
    deliveryId: input.deliveryId,
    channel: "email",
    status: input.outcome.status,
    latestAttemptId: input.attemptId,
    acceptedAt: input.outcome.acceptedAt,
    deliveredAt: input.outcome.deliveredAt,
    failedAt: input.outcome.failedAt,
    updatedAt: input.occurredAt,
    error: input.outcome.error,
  };
}
