import type { DeliveryEvent } from "@iterava/colis";
import type { ProviderDispatchOutcome } from "../providers/types.ts";

export function normalizeDeliveryEvent(input: {
  eventId: string;
  attemptId: string;
  deliveryId: string;
  outcome: ProviderDispatchOutcome;
  occurredAt: string;
}): DeliveryEvent {
  return {
    eventId: input.eventId,
    deliveryId: input.deliveryId,
    status: input.outcome.status,
    attemptId: input.attemptId,
    occurredAt: input.occurredAt,
    error: input.outcome.error,
  };
}
