export interface EmailAddress {
  email: string;
  name?: string;
}

export type EmailTargetValue = string | EmailAddress;

export interface EmailTarget {
  to: readonly EmailTargetValue[];
  cc?: readonly EmailTargetValue[];
  bcc?: readonly EmailTargetValue[];
  from?: EmailTargetValue;
  replyTo?: readonly EmailTargetValue[];
}

export interface NormalizedEmailAddress {
  email: string;
  name?: string;
}

export interface NormalizedEmailTarget {
  to: readonly NormalizedEmailAddress[];
  cc: readonly NormalizedEmailAddress[];
  bcc: readonly NormalizedEmailAddress[];
  from?: NormalizedEmailAddress;
  replyTo: readonly NormalizedEmailAddress[];
}
