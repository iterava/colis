import type { DeliveryError } from "./error";
import type { DeliveryStatus } from "./status";

export interface DeliveryReceipt {
  readonly deliveryId: string;
  readonly channel: string;
  readonly status: DeliveryStatus;
  readonly latestAttemptId?: string;
  readonly acceptedAt?: string;
  readonly deliveredAt?: string;
  readonly failedAt?: string;
  readonly canceledAt?: string;
  readonly updatedAt: string;
  readonly error?: DeliveryError;
}
