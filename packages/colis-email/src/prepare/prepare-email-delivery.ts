import type { PreparedDelivery } from "@iterava/colis";
import type { NormalizedEmailContent } from "../email/content.ts";
import {
  toCoreEmailDeliveryRequest,
  type EmailMetadata,
  type EmailRequest,
} from "../email/request.ts";
import type {
  EmailTargetValue,
  NormalizedEmailAddress,
  NormalizedEmailTarget,
} from "../email/target.ts";
import { EmailError } from "../errors/email-error.ts";

export type PreparedEmailDelivery = PreparedDelivery<
  NormalizedEmailContent,
  NormalizedEmailTarget,
  EmailMetadata
>;

export interface PrepareEmailDeliveryOptions {
  createDeliveryId?: () => string;
  now?: () => Date;
}

export function prepareEmailDelivery(
  request: EmailRequest,
  options: PrepareEmailDeliveryOptions = {},
): PreparedEmailDelivery {
  const coreRequest = toCoreEmailDeliveryRequest(request);
  const preparedAt = (options.now ?? (() => new Date()))().toISOString();
  const deliveryId = options.createDeliveryId?.() ?? `email_${preparedAt.replaceAll(/[-:.]/g, "")}`;
  const normalizedTarget = normalizeTarget(coreRequest.target);
  const preparedPayload = normalizeContent(coreRequest.payload);

  return {
    deliveryId,
    channel: coreRequest.channel,
    normalizedTarget,
    preparedPayload,
    metadata: coreRequest.metadata ? { ...coreRequest.metadata } : undefined,
    idempotencyKey: coreRequest.idempotencyKey,
    preparedAt,
  };
}

function normalizeTarget(target: EmailRequest["target"]): NormalizedEmailTarget {
  const to = normalizeList(target.to, "target.to");

  if (to.length === 0) {
    throw new EmailError("At least one target.to address is required.", {
      phase: "prepare",
      code: "EMAIL_TARGET_REQUIRED",
      retryable: false,
    });
  }

  return {
    to,
    cc: normalizeList(target.cc ?? [], "target.cc"),
    bcc: normalizeList(target.bcc ?? [], "target.bcc"),
    from: target.from ? normalizeAddress(target.from, "target.from") : undefined,
    replyTo: normalizeList(target.replyTo ?? [], "target.replyTo"),
  };
}

function normalizeContent(content: EmailRequest["content"]): NormalizedEmailContent {
  const subject = content.subject.trim();

  if (subject.length === 0) {
    throw new EmailError("Email subject is required.", {
      phase: "prepare",
      code: "EMAIL_SUBJECT_REQUIRED",
      retryable: false,
    });
  }

  const html = normalizeOptionalString(content.html);
  const text = normalizeOptionalString(content.text);

  if (!html && !text) {
    throw new EmailError("Email content requires html or text.", {
      phase: "prepare",
      code: "EMAIL_BODY_REQUIRED",
      retryable: false,
    });
  }

  return {
    subject,
    html,
    text,
    headers: Object.freeze({ ...content.headers }),
    tags: Object.freeze(
      dedupe(content.tags ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  };
}

function normalizeList(
  entries: readonly EmailTargetValue[],
  field: string,
): readonly NormalizedEmailAddress[] {
  return Object.freeze(dedupeByEmail(entries.map((entry) => normalizeAddress(entry, field))));
}

function normalizeAddress(value: EmailTargetValue, field: string): NormalizedEmailAddress {
  const candidate = typeof value === "string" ? { email: value } : value;
  const email = candidate.email.trim().toLowerCase();

  if (email.length === 0) {
    throw new EmailError(`Invalid email address at ${field}.`, {
      phase: "prepare",
      code: "EMAIL_ADDRESS_INVALID",
      retryable: false,
      details: { field, value },
    });
  }

  const normalized: NormalizedEmailAddress = { email };
  const name = candidate.name?.trim();

  if (name) {
    normalized.name = name;
  }

  return normalized;
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function dedupe(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function dedupeByEmail(
  values: readonly NormalizedEmailAddress[],
): readonly NormalizedEmailAddress[] {
  const seen = new Set<string>();
  const normalized: NormalizedEmailAddress[] = [];

  for (const value of values) {
    if (seen.has(value.email)) {
      continue;
    }

    seen.add(value.email);
    normalized.push(value);
  }

  return normalized;
}
