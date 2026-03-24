import type { DeliveryError } from "./error";
import type { DeliveryStatus } from "./status";

export interface DeliveryAttempt {
  readonly attemptId: string;
  readonly deliveryId: string;
  readonly status: DeliveryStatus;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly externalReference?: string;
  readonly error?: DeliveryError;
}
