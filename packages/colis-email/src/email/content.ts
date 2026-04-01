export interface EmailContent {
  subject: string;
  html?: string;
  text?: string;
  headers?: Readonly<Record<string, string>>;
  tags?: readonly string[];
}

export interface NormalizedEmailContent {
  subject: string;
  html?: string;
  text?: string;
  headers: Readonly<Record<string, string>>;
  tags: readonly string[];
}
