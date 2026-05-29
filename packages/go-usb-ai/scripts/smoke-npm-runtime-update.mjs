#!/usr/bin/env node

import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import JSZip from "jszip";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workspaceRoot = resolve(packageRoot, "../..");
const runtimeVersion = "0.99.1";
const channel = "stable";
const platform = process.platform;
const arch = process.arch;

function parseArgs(argv) {
  return new Set(argv.filter((arg) => arg.startsWith("--")));
}

function log(message) {
  console.log(`[smoke:npm-runtime-update] ${message}`);
}

function run(command, args, options = {}) {
  log(`running ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    env: {
      ...process.env,
      ...options.env
    },
    encoding: "utf8",
    timeout: 120000
  });
  if (result.status !== 0) {
    throw new Error([
      `command failed: ${command} ${args.join(" ")}`,
      result.error ? String(result.error) : "",
      result.stdout.trim(),
      result.stderr.trim()
    ].filter(Boolean).join("\n"));
  }
  return result;
}

function runLauncher(args, env) {
  const launcherPath = join(packageRoot, "dist/cli/launcher/index.js");
  const result = run(process.execPath, [launcherPath, ...args], { env });
  return result.stdout.trim();
}

function parseLauncherJson(args, env) {
  const stdout = runLauncher(args, env);
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`launcher command did not print JSON:\n${stdout}\n${String(error)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function serializeUnsignedUpdateManifest(manifest) {
  return JSON.stringify({
    channel: manifest.channel,
    platform: manifest.platform,
    arch: manifest.arch,
    hostKind: manifest.hostKind,
    latestVersion: manifest.latestVersion,
    minimumLauncherVersion: manifest.minimumLauncherVersion,
    bundleUrl: manifest.bundleUrl,
    bundleSha256: manifest.bundleSha256,
    bundleSignature: manifest.bundleSignature,
    releaseNotesUrl: manifest.releaseNotesUrl
  });
}

function createRuntimeScript() {
  return [
    "#!/usr/bin/env node",
    "if (process.argv.includes('--version')) {",
    `  console.log('smoke-runtime-${runtimeVersion}');`,
    "} else {",
    `  console.log('smoke-runtime-${runtimeVersion}');`,
    "}"
  ].join("\n");
}

async function createRuntimeBundle(privateKey) {
  const zip = new JSZip();
  const bundleManifest = {
    bundleVersion: runtimeVersion,
    platform,
    arch,
    uiVersion: runtimeVersion,
    runtimeVersion,
    builtInPluginSetVersion: runtimeVersion,
    launcherCompatibility: {
      minVersion: "0.18.11"
    },
    entrypoints: {
      runtimeScript: "runtime/dist/cli/app/index.js"
    },
    migrationVersion: 1
  };
  zip.file("bundle/manifest.json", `${JSON.stringify(bundleManifest, null, 2)}\n`);
  zip.file("bundle/runtime/dist/cli/app/index.js", `${createRuntimeScript()}\n`, {
    unixPermissions: 0o755
  });
  zip.file("bundle/ui/index.html", "<!doctype html><title>GoUsbAi smoke runtime</title>\n");
  zip.file("bundle/plugins/.keep", "");
  const bytes = await zip.generateAsync({
    type: "nodebuffer",
    platform: "UNIX",
    compression: "DEFLATE"
  });
  return {
    bytes,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    signature: sign(null, bytes, privateKey).toString("base64")
  };
}

function createManifest(bundle, bundleUrl, privateKey) {
  const unsignedManifest = {
    channel,
    platform,
    arch,
    hostKind: "npm-runtime-bundle",
    latestVersion: runtimeVersion,
    minimumLauncherVersion: "0.18.11",
    bundleUrl,
    bundleSha256: bundle.sha256,
    bundleSignature: bundle.signature,
    releaseNotesUrl: "https://example.invalid/go-usb-ai-smoke-runtime"
  };
  return {
    ...unsignedManifest,
    manifestSignature: sign(null, Buffer.from(serializeUnsignedUpdateManifest(unsignedManifest)), privateKey).toString("base64")
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.has("--published-beta")) {
    const fixture = await createPublishedBetaFixture();
    try {
      verifyPublishedBetaInstall(fixture);
      log("published beta install smoke passed");
    } finally {
      rmSync(fixture.tempRoot, { recursive: true, force: true });
    }
    return;
  }

  run("pnpm", ["-C", "packages/go-usb-ai-kernel", "build"]);
  run("pnpm", ["-C", "packages/go-usb-ai-service", "build"]);
  run("pnpm", ["-C", "packages/go-usb-ai", "build"]);

  const fixture = await createUpdateFixture();
  if (args.has("--manual") || args.has("--validation")) {
    printManualValidationGuide(fixture);
    return;
  }

  try {
    await verifyRuntimeUpdateFlow(fixture);
    log("npm runtime update smoke passed");
  } finally {
    rmSync(fixture.tempRoot, { recursive: true, force: true });
  }
}

async function createUpdateFixture() {
  const tempRoot = await mkdtemp(join(tmpdir(), "go-usb-ai-npm-runtime-update-smoke-"));
  const go-usb-aiHome = join(tempRoot, "home");
  const serverRoot = join(tempRoot, "server");
  const channelDirectory = join(serverRoot, channel);
  mkdirSync(channelDirectory, { recursive: true });

  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const bundle = await createRuntimeBundle(privateKey);
  const bundleName = `go-usb-ai-runtime-${runtimeVersion}-${platform}-${arch}.zip`;
  const bundlePath = join(channelDirectory, bundleName);
  writeFileSync(bundlePath, bundle.bytes);
  const manifestPath = join(channelDirectory, `manifest-${channel}-${platform}-${arch}.json`);
  const publicKeyPath = join(tempRoot, "update-public-key.pem");
  writeFileSync(publicKeyPath, publicKeyPem, "utf8");
  const binDirectory = join(tempRoot, "bin");
  const go-usb-aiShimPath = join(binDirectory, "go-usb-ai");
  mkdirSync(binDirectory, { recursive: true });
  writeFileSync(
    go-usb-aiShimPath,
    ["#!/usr/bin/env sh", `exec "${process.execPath}" "${join(packageRoot, "dist/cli/launcher/index.js")}" "$@"`, ""].join("\n"),
    "utf8"
  );
  chmodSync(go-usb-aiShimPath, 0o755);
  const env = {
    GOUSB_AI_HOME: go-usb-aiHome,
    GOUSB_AI_UPDATE_BUNDLE_PUBLIC_KEY_PATH: publicKeyPath,
    GOUSB_AI_UPDATE_MANIFEST_URL: pathToFileURL(manifestPath).toString()
  };
  const manifest = createManifest(bundle, pathToFileURL(bundlePath).toString(), privateKey);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { binDirectory, env, manifestPath, go-usb-aiShimPath, go-usb-aiHome, publicKeyPath, tempRoot };
}

async function createPublishedBetaFixture() {
  const tempRoot = await mkdtemp(join(tmpdir(), "go-usb-ai-published-beta-smoke-"));
  const prefix = join(tempRoot, "prefix");
  mkdirSync(prefix, { recursive: true });
  run("npm", ["install", "-g", "go-usb-ai@beta", "--prefix", prefix], { cwd: tempRoot });
  const packageDirectory = join(prefix, "lib/node_modules/go-usb-ai");
  const binaryPath = join(prefix, "bin/go-usb-ai");
  return {
    binaryPath,
    packageDirectory,
    prefix,
    tempRoot
  };
}

async function verifyRuntimeUpdateFlow(fixture) {
  const { env, go-usb-aiHome } = fixture;
  const checkSnapshot = parseLauncherJson(["update", "--check", "--json"], env);
  assert(checkSnapshot.status === "update-available", `expected update-available, got ${checkSnapshot.status}`);
  assert(checkSnapshot.availableVersion === runtimeVersion, `expected available version ${runtimeVersion}`);
  assert(!existsSync(join(go-usb-aiHome, "launcher/runtime-bundles/current.json")), "check unexpectedly changed current pointer");

  const updateSnapshot = parseLauncherJson(["update", "--json"], env);
  assert(updateSnapshot.status === "restart-required", `expected restart-required, got ${updateSnapshot.status}`);
  assert(updateSnapshot.currentVersion === runtimeVersion, `expected current version ${runtimeVersion}`);
  await assertLauncherUsesAppliedRuntime(env, go-usb-aiHome);
}

async function assertLauncherUsesAppliedRuntime(env, go-usb-aiHome) {
  const currentPointer = JSON.parse(await readFile(join(go-usb-aiHome, "launcher/runtime-bundles/current.json"), "utf8"));
  assert(currentPointer.version === runtimeVersion, `current pointer expected ${runtimeVersion}`);

  const versionOutput = runLauncher(["--version"], env);
  assert(versionOutput === `smoke-runtime-${runtimeVersion}`, `launcher did not switch to smoke runtime: ${versionOutput}`);

  const topLevelEntries = await readdir(go-usb-aiHome);
  const forbiddenEntries = topLevelEntries.filter((entry) => ["config.json", "sessions", "skills", "workspace"].includes(entry));
  assert(forbiddenEntries.length === 0, `runtime update touched user-owned entries: ${forbiddenEntries.join(", ")}`);
}

function verifyPublishedBetaInstall(fixture) {
  const expectedVersion = JSON.parse(run("npm", ["view", "go-usb-ai@beta", "version", "--json"]).stdout.trim());
  const installedVersion = run(fixture.binaryPath, ["--version"], {
    cwd: fixture.packageDirectory
  }).stdout.trim();
  assert(installedVersion === expectedVersion, `expected go-usb-ai@beta ${expectedVersion}, got ${installedVersion}`);

  const apiProbe = run(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      [
        "import { InputBudgetPruner } from '@go-usb-ai/core';",
        "const pruner = new InputBudgetPruner();",
        "console.log(JSON.stringify({ estimateType: typeof pruner.estimate, pruneType: typeof pruner.prune }));"
      ].join(" ")
    ],
    {
      cwd: fixture.packageDirectory
    }
  );
  const apiSnapshot = JSON.parse(apiProbe.stdout.trim());
  assert(apiSnapshot.estimateType === "function", `expected estimate() to exist, got ${apiSnapshot.estimateType}`);
  assert(apiSnapshot.pruneType === "function", `expected prune() to exist, got ${apiSnapshot.pruneType}`);

  console.log(`
[validation:npm-update --published-beta] Published beta install verified.

- installed binary: ${fixture.binaryPath}
- installed version: ${installedVersion}
- InputBudgetPruner.estimate: ${apiSnapshot.estimateType}
- InputBudgetPruner.prune: ${apiSnapshot.pruneType}

Clean up when finished:
rm -rf "${fixture.tempRoot}"
`);
}

function printManualValidationGuide(fixture) {
  console.log(`
[validation:npm-update] Prepared local npm runtime update fixture.

This keeps all state in a temporary GOUSB_AI_HOME and adds a temporary go-usb-ai shim to PATH.
It does not touch your real ~/.go-usb-ai or global npm installation.

Run these commands in a shell:

export PATH="${fixture.binDirectory}:$PATH"
export GOUSB_AI_HOME="${fixture.go-usb-aiHome}"
export GOUSB_AI_UPDATE_BUNDLE_PUBLIC_KEY_PATH="${fixture.publicKeyPath}"
export GOUSB_AI_UPDATE_MANIFEST_URL="${fixture.env.GOUSB_AI_UPDATE_MANIFEST_URL}"

go-usb-ai --version
go-usb-ai update --check
go-usb-ai --version
go-usb-ai update
go-usb-ai --version

Expected user-facing behavior:
1. The first go-usb-ai --version prints the packaged npm launcher runtime version.
2. go-usb-ai update --check reports runtime update ${runtimeVersion} without downloading or switching.
3. go-usb-ai update downloads and applies runtime update ${runtimeVersion}, then asks for a restart/new process.
4. The final go-usb-ai --version prints smoke-runtime-${runtimeVersion}.

Useful files:
- GOUSB_AI_HOME: ${fixture.go-usb-aiHome}
- manifest: ${fixture.manifestPath}
- temporary go-usb-ai shim: ${fixture.go-usb-aiShimPath}

Clean up when finished:
rm -rf "${fixture.tempRoot}"
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
