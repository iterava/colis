export type {
  DeliveryAttempt,
  DeliveryError,
  DeliveryEvent,
  DeliveryPhase,
  DeliveryReceipt,
  DeliveryRequest,
  DeliveryStatus,
  PreparedDelivery,
} from "@iterava/colis";
export {
  dispatchEmailDelivery,
  type DispatchEmailDeliveryOptions,
  type DispatchEmailDeliveryResult,
} from "./dispatch/dispatch-email-delivery.ts";
export { type EmailContent, type NormalizedEmailContent } from "./email/content.ts";
export {
  type CoreEmailDeliveryRequest,
  type EmailMetadata,
  type EmailRequest,
} from "./email/request.ts";
export {
  type EmailAddress,
  type EmailTarget,
  type EmailTargetValue,
  type NormalizedEmailAddress,
  type NormalizedEmailTarget,
} from "./email/target.ts";
export {
  EmailError,
  type EmailErrorOptions,
  type EmailErrorPhase,
  type EmailErrorShape,
} from "./errors/email-error.ts";
export {
  prepareEmailDelivery,
  type PreparedEmailDelivery,
  type PrepareEmailDeliveryOptions,
} from "./prepare/prepare-email-delivery.ts";
export {
  type EmailDeliveryStatus,
  type EmailProviderAdapter,
  type ProviderDispatchDiagnostics,
  type ProviderDispatchInput,
  type ProviderDispatchOutcome,
} from "./providers/types.ts";
