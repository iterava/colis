import type { DeliveryError } from "./error";
import type { DeliveryStatus } from "./status";

/**
 * Current normalized snapshot of delivery state.
 *
 * A receipt is a state model, not an event record and not a container for full attempt history.
 */
export interface DeliveryReceipt {
  /** Stable logical delivery identifier. */
  readonly deliveryId: string;
  /** Logical delivery channel identifier. */
  readonly channel: string;
  /** Current normalized delivery status. */
  readonly status: DeliveryStatus;
  /** Optional pointer to the latest known attempt. */
  readonly latestAttemptId?: string;
  /** ISO-8601 timestamp for when the delivery was accepted, if known. */
  readonly acceptedAt?: string;
  /** ISO-8601 timestamp for when the delivery was delivered, if known. */
  readonly deliveredAt?: string;
  /** ISO-8601 timestamp for when the delivery failed, if known. */
  readonly failedAt?: string;
  /** ISO-8601 timestamp for when the delivery was canceled, if known. */
  readonly canceledAt?: string;
  /** ISO-8601 timestamp for when this snapshot was last updated. */
  readonly updatedAt: string;
  /** Optional normalized error describing the current failed/canceled state. */
  readonly error?: DeliveryError;
}
