export interface DeliveryMetadata {
  readonly [key: string]: unknown;
}

/**
 * Application-facing input to the Colis core contract layer.
 *
 * `payload` and `target` remain opaque so core stays channel-agnostic.
 */
export interface DeliveryRequest<
  TPayload = unknown,
  TTarget = unknown,
  TMetadata extends DeliveryMetadata = DeliveryMetadata,
> {
  /** Logical delivery channel identifier, such as `email`, `sms`, or `push`. */
  readonly channel: string;
  /** Opaque channel payload owned by the downstream channel package. */
  readonly payload: TPayload;
  /** Opaque delivery target. Core uses `target`, not channel-specific recipient terms. */
  readonly target: TTarget;
  /** Optional application metadata carried through the delivery lifecycle. */
  readonly metadata?: TMetadata;
  /** Optional caller-provided idempotency hint. */
  readonly idempotencyKey?: string;
}
