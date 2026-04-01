import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRequire = createRequire(path.join(rootDir, "packages/colis/package.json"));
const packages = [
  { name: "@iterava/colis", distEntry: "package/dist/index.mjs" },
  {
    name: "@iterava/colis-email",
    distEntry: "package/dist/index.mjs",
    subpathEntry: "package/dist/providers/resend/index.mjs",
  },
];
const packOnly = process.argv.includes("--pack-only");
const artifactsDir = path.join(rootDir, ".tmp", "tarballs");

fs.rmSync(artifactsDir, { recursive: true, force: true });
fs.mkdirSync(artifactsDir, { recursive: true });

const tarballs = new Map();

for (const pkg of packages) {
  tarballs.set(pkg.name, packPackage(pkg.name));
}

for (const pkg of packages) {
  inspectTarball(pkg, tarballs.get(pkg.name));
}

if (packOnly) {
  console.log(`Packed tarballs to ${artifactsDir}`);
  process.exit(0);
}

const smokeDir = fs.mkdtempSync(path.join(os.tmpdir(), "colis-tarball-smoke-"));

writeJson(path.join(smokeDir, "package.json"), {
  name: "colis-tarball-smoke",
  private: true,
  type: "module",
  packageManager: "pnpm@10.33.0",
  dependencies: {
    "@iterava/colis": `file:${tarballs.get("@iterava/colis")}`,
    "@iterava/colis-email": `file:${tarballs.get("@iterava/colis-email")}`,
  },
  pnpm: {
    overrides: {
      "@iterava/colis": `file:${tarballs.get("@iterava/colis")}`,
    },
  },
});

run("pnpm", ["install"], { cwd: smokeDir, env: { ...process.env, CI: "1" } });

fs.writeFileSync(
  path.join(smokeDir, "runtime-smoke.mjs"),
  `import * as colis from "@iterava/colis";
import * as colisEmail from "@iterava/colis-email";
import * as resend from "@iterava/colis-email/providers/resend";

if (typeof colis !== "object") {
  throw new Error("Core entrypoint did not load.");
}

if (typeof colisEmail.prepareEmailDelivery !== "function") {
  throw new Error("Email root entrypoint is missing prepareEmailDelivery.");
}

if (typeof resend.createResendEmailProvider !== "function") {
  throw new Error("Resend subpath entrypoint is missing createResendEmailProvider.");
}
`,
);

fs.writeFileSync(
  path.join(smokeDir, "compile-smoke.ts"),
  `import type { DeliveryRequest } from "@iterava/colis";
import { prepareEmailDelivery, type EmailRequest } from "@iterava/colis-email";
import {
  createResendEmailProvider,
  type ResendTransport,
} from "@iterava/colis-email/providers/resend";

const request: DeliveryRequest<{ subject: string; text: string }, { to: readonly string[] }> = {
  channel: "email",
  payload: {
    subject: "Hello",
    text: "World",
  },
  target: {
    to: ["user@example.com"],
  },
};

const emailRequest: EmailRequest = {
  target: {
    to: ["user@example.com"],
  },
  content: {
    subject: "Hello",
    text: "World",
  },
};

const prepared = prepareEmailDelivery(emailRequest);

const transport: ResendTransport = {
  async sendEmail() {
    return { id: "re_123" };
  },
};

const provider = createResendEmailProvider({ transport });

void request;
void prepared;
void provider;
`,
);

writeJson(path.join(smokeDir, "tsconfig.json"), {
  compilerOptions: {
    target: "ES2023",
    module: "NodeNext",
    moduleResolution: "NodeNext",
    strict: true,
    noEmit: true,
  },
  include: ["compile-smoke.ts"],
});

run("node", ["runtime-smoke.mjs"], { cwd: smokeDir });

const tscBin = packageRequire.resolve("typescript/bin/tsc");
run("node", [tscBin, "-p", "tsconfig.json"], { cwd: smokeDir });

console.log(`Tarball smoke passed in ${smokeDir}`);

function packPackage(packageName) {
  const before = new Set(fs.readdirSync(artifactsDir));

  run("pnpm", ["--filter", packageName, "pack", "--pack-destination", artifactsDir], {
    cwd: rootDir,
  });

  const created = fs
    .readdirSync(artifactsDir)
    .filter((entry) => entry.endsWith(".tgz") && !before.has(entry));

  if (created.length !== 1) {
    throw new Error(`Expected one tarball for ${packageName}, found ${created.length}.`);
  }

  return path.join(artifactsDir, created[0]);
}

function inspectTarball(pkg, tarballPath) {
  const files = execFileSync("tar", ["-tzf", tarballPath], {
    cwd: rootDir,
    encoding: "utf8",
  })
    .trim()
    .split("\n");

  if (!files.includes("package/package.json")) {
    throw new Error(`${pkg.name} tarball is missing package.json.`);
  }

  if (!files.includes("package/README.md")) {
    throw new Error(`${pkg.name} tarball is missing README.md.`);
  }

  if (!files.includes(pkg.distEntry)) {
    throw new Error(`${pkg.name} tarball is missing ${pkg.distEntry}.`);
  }

  if (pkg.subpathEntry && !files.includes(pkg.subpathEntry)) {
    throw new Error(`${pkg.name} tarball is missing ${pkg.subpathEntry}.`);
  }

  const packedManifest = JSON.parse(
    execFileSync("tar", ["-xOf", tarballPath, "package/package.json"], {
      cwd: rootDir,
      encoding: "utf8",
    }),
  );

  if (JSON.stringify(packedManifest).includes('"workspace:')) {
    throw new Error(`${pkg.name} tarball still contains a workspace dependency spec.`);
  }

  if (JSON.stringify(packedManifest).includes('"link:')) {
    throw new Error(`${pkg.name} tarball still contains a link dependency spec.`);
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function run(command, args, options) {
  execFileSync(command, args, {
    ...options,
    stdio: "inherit",
  });
}
