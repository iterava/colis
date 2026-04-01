# @iterava/colis

`@iterava/colis` is the channel-agnostic core package for Colis.

It defines the shared delivery lifecycle contracts that downstream channel and runtime packages can build on without pushing channel-specific semantics into the core package.

Most application users should start with `@iterava/colis-email`. This package is primarily for shared contract consumers and downstream package authors.

## Scope

- normalized delivery request, preparation, attempt, receipt, and event contracts
- provider-neutral delivery status and error vocabulary
- no email-only payload fields, provider SDK bindings, or runtime orchestration concerns

## Development

```bash
vp install
vp run --filter @iterava/colis check
vp run --filter @iterava/colis test
vp run --filter @iterava/colis build
```

## License

Released under the MIT License.
