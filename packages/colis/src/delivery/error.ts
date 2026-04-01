/**
 * Normalized processing phase for delivery diagnostics.
 */
export type DeliveryPhase = "validate" | "prepare" | "dispatch";

/**
 * Compact, provider-neutral delivery error vocabulary for phase 1.
 */
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

/**
 * Normalized delivery error shape used across requests, attempts, receipts, and events.
 */
export interface DeliveryError {
  /** Processing phase where the error occurred. */
  readonly phase: DeliveryPhase;
  /** Compact provider-neutral error code. */
  readonly code: DeliveryErrorCode;
  /** Human-readable error message. */
  readonly message: string;
  /** Whether the error may be retried by a downstream runtime. */
  readonly retryable: boolean;
  /** Optional raw downstream cause retained without introducing provider types into core. */
  readonly cause?: unknown;
  /** Optional structured diagnostics safe for downstream interpretation. */
  readonly details?: DeliveryErrorDetails;
}
