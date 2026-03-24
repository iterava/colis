export type DeliveryPhase = "validate" | "prepare" | "dispatch";

export type DeliveryErrorCode =
  | "invalid_request"
  | "invalid_target"
  | "invalid_payload"
  | "prepare_failed"
  | "dispatch_rejected"
  | "dispatch_failed"
  | "delivery_canceled";

export interface DeliveryErrorDetails {
  readonly [key: string]: unknown;
}

export interface DeliveryError {
  readonly phase: DeliveryPhase;
  readonly code: DeliveryErrorCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly cause?: unknown;
  readonly details?: DeliveryErrorDetails;
}
