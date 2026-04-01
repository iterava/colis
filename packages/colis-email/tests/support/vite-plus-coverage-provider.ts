import { createRequire } from "node:module";
import coverageModule from "@vitest/coverage-v8";

const require = createRequire(import.meta.url);
const { version } = require("vite-plus/package.json") as { version: string };

export default {
  ...coverageModule,
  async getProvider() {
    const provider = (await coverageModule.getProvider()) as unknown as {
      version: string;
    };
    provider.version = version;
    return provider;
  },
};
