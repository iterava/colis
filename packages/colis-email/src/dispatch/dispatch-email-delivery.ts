import type { DeliveryAttempt, DeliveryEvent, DeliveryReceipt } from "@iterava/colis";
import { EmailError } from "../errors/email-error.ts";
import { normalizeDeliveryAttempt } from "../normalize/delivery-attempt.ts";
import { normalizeDeliveryEvent } from "../normalize/delivery-event.ts";
import { normalizeDeliveryReceipt } from "../normalize/delivery-receipt.ts";
import type { PreparedEmailDelivery } from "../prepare/prepare-email-delivery.ts";
import type { EmailProviderAdapter, ProviderDispatchOutcome } from "../providers/types.ts";

export interface DispatchEmailDeliveryOptions {
  createAttemptId?: () => string;
  createEventId?: () => string;
  now?: () => Date;
}

export interface DispatchEmailDeliveryResult {
  attempt: DeliveryAttempt;
  receipt: DeliveryReceipt;
  events: readonly DeliveryEvent[];
  outcome: ProviderDispatchOutcome;
}

export async function dispatchEmailDelivery(
  prepared: PreparedEmailDelivery,
  provider: EmailProviderAdapter,
  options: DispatchEmailDeliveryOptions = {},
): Promise<DispatchEmailDeliveryResult> {
  const now = options.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const attemptId =
    options.createAttemptId?.() ??
    `${prepared.deliveryId}_attempt_${provider.provider}_${globalThis.crypto.randomUUID()}`;

  let outcome: ProviderDispatchOutcome;

  try {
    outcome = await provider.dispatch(prepared);
  } catch (error) {
    if (error instanceof EmailError) {
      throw error;
    }

    throw new EmailError("Email provider dispatch failed unexpectedly.", {
      phase: "dispatch",
      code: "EMAIL_PROVIDER_DISPATCH_FAILED",
      retryable: true,
      cause: error,
      details: { provider: provider.provider },
    });
  }

  const completedAt = now().toISOString();

  return {
    attempt: normalizeDeliveryAttempt({
      attemptId,
      deliveryId: prepared.deliveryId,
      outcome,
      startedAt,
      completedAt,
    }),
    receipt: normalizeDeliveryReceipt({
      attemptId,
      deliveryId: prepared.deliveryId,
      outcome,
      occurredAt: completedAt,
    }),
    events: Object.freeze([
      normalizeDeliveryEvent({
        eventId: options.createEventId?.() ?? `${attemptId}_${outcome.status}`,
        attemptId,
        deliveryId: prepared.deliveryId,
        outcome,
        occurredAt: completedAt,
      }),
    ]),
    outcome,
  };
}
