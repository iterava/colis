export type EmailErrorPhase = "validate" | "prepare" | "dispatch";

export interface EmailErrorShape {
  phase: EmailErrorPhase;
  code: string;
  message: string;
  retryable: boolean;
  details?: unknown;
}

export interface EmailErrorOptions extends Omit<EmailErrorShape, "message"> {
  cause?: unknown;
}

export class EmailError extends Error implements EmailErrorShape {
  readonly phase: EmailErrorPhase;
  readonly code: string;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(message: string, options: EmailErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "EmailError";
    this.phase = options.phase;
    this.code = options.code;
    this.retryable = options.retryable;
    this.details = options.details;
  }
}
