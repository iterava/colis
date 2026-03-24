import type { DeliveryError } from "./error";
import type { DeliveryStatus } from "./status";

export interface DeliveryEvent {
  readonly eventId: string;
  readonly deliveryId: string;
  readonly status: DeliveryStatus;
  readonly occurredAt: string;
  readonly attemptId?: string;
  readonly error?: DeliveryError;
}
