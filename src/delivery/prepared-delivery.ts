import type { DeliveryMetadata } from "./request";

export interface PreparedDelivery<
  TPreparedPayload = unknown,
  TNormalizedTarget = unknown,
  TMetadata extends DeliveryMetadata = DeliveryMetadata,
> {
  readonly deliveryId: string;
  readonly channel: string;
  readonly preparedPayload: TPreparedPayload;
  readonly normalizedTarget: TNormalizedTarget;
  readonly metadata?: TMetadata;
  readonly idempotencyKey?: string;
  readonly preparedAt: string;
}
