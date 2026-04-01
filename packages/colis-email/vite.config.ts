import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    coverage: {
      provider: "custom",
      customProviderModule: "./tests/support/vite-plus-coverage-provider.ts",
      exclude: ["src/index.ts", "src/providers/**/index.ts", "tests/support/**"],
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    entry: ["src/index.ts", "src/providers/resend/index.ts"],
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
