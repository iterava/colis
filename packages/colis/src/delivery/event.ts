import type { DeliveryError } from "./error";
import type { DeliveryStatus } from "./status";

/**
 * Point-in-time normalized lifecycle transition.
 *
 * An event is distinct from {@link DeliveryReceipt}, which models the latest known snapshot.
 */
export interface DeliveryEvent {
  /** Stable identifier for this event. */
  readonly eventId: string;
  /** Parent logical delivery identifier. */
  readonly deliveryId: string;
  /** Normalized status represented by this transition. */
  readonly status: DeliveryStatus;
  /** ISO-8601 timestamp for when the transition occurred. */
  readonly occurredAt: string;
  /** Optional related attempt identifier when the event came from a dispatch try. */
  readonly attemptId?: string;
  /** Optional normalized error details associated with the transition. */
  readonly error?: DeliveryError;
}
