export interface DeliveryMetadata {
  readonly [key: string]: unknown;
}

export interface DeliveryRequest<
  TPayload = unknown,
  TTarget = unknown,
  TMetadata extends DeliveryMetadata = DeliveryMetadata,
> {
  readonly channel: string;
  readonly payload: TPayload;
  readonly target: TTarget;
  readonly metadata?: TMetadata;
  readonly idempotencyKey?: string;
}
