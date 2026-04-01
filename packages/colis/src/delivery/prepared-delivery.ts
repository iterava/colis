import type { DeliveryMetadata } from "./request";

/**
 * Validated and normalized delivery state produced from a {@link DeliveryRequest}.
 *
 * This is still a pure contract object, not a queue job, persistence model, or worker payload.
 */
export interface PreparedDelivery<
  TPreparedPayload = unknown,
  TNormalizedTarget = unknown,
  TMetadata extends DeliveryMetadata = DeliveryMetadata,
> {
  /** Stable logical identifier for the delivery across attempts. */
  readonly deliveryId: string;
  /** Logical delivery channel identifier. */
  readonly channel: string;
  /** Opaque prepared payload ready for downstream dispatch. */
  readonly preparedPayload: TPreparedPayload;
  /** Opaque normalized target ready for downstream dispatch. */
  readonly normalizedTarget: TNormalizedTarget;
  /** Optional application metadata preserved from the request. */
  readonly metadata?: TMetadata;
  /** Optional caller-provided idempotency hint preserved from the request. */
  readonly idempotencyKey?: string;
  /** ISO-8601 timestamp for when preparation completed. */
  readonly preparedAt: string;
}
