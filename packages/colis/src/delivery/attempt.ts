import type { DeliveryError } from "./error";
import type { DeliveryStatus } from "./status";

/**
 * One dispatch try for a prepared delivery.
 */
export interface DeliveryAttempt {
  /** Stable identifier for this attempt. */
  readonly attemptId: string;
  /** Parent logical delivery identifier shared across attempts. */
  readonly deliveryId: string;
  /** Normalized high-level attempt status. */
  readonly status: DeliveryStatus;
  /** ISO-8601 timestamp for when dispatch started. */
  readonly startedAt: string;
  /** ISO-8601 timestamp for when dispatch completed, if known. */
  readonly completedAt?: string;
  /** Optional downstream/provider reference captured during dispatch. */
  readonly externalReference?: string;
  /** Optional normalized error details for failed or rejected attempts. */
  readonly error?: DeliveryError;
}
