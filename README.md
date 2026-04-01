# Colis

Colis (pronounced ko-lee) is programmable delivery infrastructure for modern applications.

This repository is a private workspace root for the Colis monorepo. The publishable packages live under `packages/`.

## Package Map

- `@iterava/colis`: the channel-agnostic core delivery contract layer
- `@iterava/colis-email`: the first downstream email package built on those core contracts

Most application users should start with `@iterava/colis-email`. The core package is for shared delivery lifecycle contracts and downstream package authors.

## Workspace Layout

```text
packages/
  colis/
  colis-email/
docs/
scripts/
```

Package READMEs:

- [`packages/colis/README.md`](./packages/colis/README.md)
- [`packages/colis-email/README.md`](./packages/colis-email/README.md)

## Development

```bash
vp install
vp run -w check
vp run -w test
vp run -w build
vp run -w smoke:tarballs
```

## License

Released under the [MIT License](./LICENSE).
