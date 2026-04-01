# @iterava/colis-email

`@iterava/colis-email` is the email-focused downstream package for Colis.

It exists to hold email-specific request, target, content, preparation, dispatch, and provider-adapter concerns without pushing those semantics into the channel-agnostic `@iterava/colis` core.

The package now consumes the real `@iterava/colis` delivery contracts directly. Email request, target, content, and provider diagnostics remain local here, while prepared deliveries and normalized lifecycle outputs use the shared core types.

The root package API is provider-neutral. Provider-specific integrations are optional adapter modules, with Resend currently living behind a dedicated provider path rather than defining the package boundary.

## Current Scope

This repository now contains the first real package skeleton:

- email-specific request, target, and content models
- a preparation path that normalizes email input into a dispatch-ready shape
- a dispatch path that consumes provider adapters and produces normalized core delivery outputs
- provider-neutral adapter interfaces and normalized package-level errors
- a first optional `resend/` adapter path as an implementation stub, not a package-wide architecture commitment

## Package Boundary

Use the root entry point for package-level email models and flows:

```ts
import {
  dispatchEmailDelivery,
  prepareEmailDelivery,
  type EmailProviderAdapter,
  type EmailRequest,
} from "@iterava/colis-email";
```

Use provider-specific code only from provider subpaths:

```ts
import { createResendEmailProvider } from "@iterava/colis-email/providers/resend";
```

## Explicit Non-Goals

This package does not currently implement:

- a provider registry or plugin framework
- provider-specific behavior as the root package API
- worker, queue, runtime, or webhook infrastructure
- multi-provider routing, failover, or orchestration
- campaign, preference-center, quiet-hours, or broader messaging-platform features

## Planning

The execution source of truth for this package lives in:

- [`docs/implementation-plan.md`](./docs/implementation-plan.md)
- [`docs/publish-transition-plan.md`](./docs/publish-transition-plan.md)

## Development

```bash
vp install
vp run --filter @iterava/colis build
vp run --filter @iterava/colis-email check
vp run --filter @iterava/colis-email test
vp run --filter @iterava/colis-email build
```

## Resend Integration Path

The package includes one opt-in Resend-backed integration slice that proves the full flow shape.

This is a provider integration harness, not a full platform end-to-end test.

- request -> `prepareEmailDelivery(...)`
- prepare -> `dispatchEmailDelivery(...)`
- dispatch -> real Resend `POST /emails`
- normalized outcome -> attempt, receipt, events, and provider outcome assertions

It is disabled by default and safe for public/OSS usage unless you opt in with explicit credentials.

Required environment variables:

- `COLIS_EMAIL_INTEGRATION_RESEND=1`
- `COLIS_EMAIL_INTEGRATION_RESEND_API_KEY`
- `COLIS_EMAIL_INTEGRATION_RESEND_FROM`
- `COLIS_EMAIL_INTEGRATION_RESEND_TO`

Optional environment variables:

- `COLIS_EMAIL_INTEGRATION_SUBJECT_PREFIX` to override the default subject prefix
- `COLIS_EMAIL_INTEGRATION_RESEND_API_BASE_URL` to target a non-default Resend API base URL

Run it with one explicit command:

```bash
COLIS_EMAIL_INTEGRATION_RESEND=1 \
COLIS_EMAIL_INTEGRATION_RESEND_API_KEY=... \
COLIS_EMAIL_INTEGRATION_RESEND_FROM=sender@example.com \
COLIS_EMAIL_INTEGRATION_RESEND_TO=recipient@example.com \
vp run test:integration:resend
```

Safety expectations:

- this path performs a real API call and is intentionally not part of the default `vp test` run
- use credentials and inboxes you control
- the command skips cleanly when `COLIS_EMAIL_INTEGRATION_RESEND` is not set to `1`
- when opt-in is enabled but required variables are missing, the run fails fast with a clear configuration error
- a live failure-path integration scenario is still future work; this first slice focuses on the real success path

What a passing result means:

- the email request was normalized into a prepared delivery
- the Resend provider adapter translated that prepared delivery into a real provider request
- Resend accepted the send request and returned an external id
- `@iterava/colis-email` normalized the provider result into the expected attempt, receipt, event, and outcome shapes

## License

Released under the MIT License.
