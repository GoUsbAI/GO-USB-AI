import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readLatestReleaseCheckpoint } from "./release-checkpoints.mjs";
import { verifyPublicRuntimeManifests } from "./release-runtime-manifest-verify.mjs";

const ROOT_DIR = process.cwd();
const REPO = "Peiiii/go-usb-ai";
const BETA_CHANNEL = "beta";
const RUNTIME_WORKFLOW = "npm-runtime-update-release.yml";
const RUNTIME_MANIFEST_TARGETS = [
  { platform: "darwin", arch: "arm64" },
  { platform: "darwin", arch: "x64" },
  { platform: "linux", arch: "x64" },
  { platform: "win32", arch: "x64" }
];

function printHelp() {
  console.log(`
Usage:
  pnpm release:beta -- [options]

Options:
  --dry-run                             Print the intended closure without mutating anything
  --skip-runtime-channel                Skip the beta runtime update workflow even if go-usb-ai is in the batch
  --release-tag <tag>                   Override the GitHub release tag used for runtime bundle assets
  --minimum-launcher-version-override <version>
                                        Recovery-only runtime manifest floor override
  --branch <branch>                     Override the git branch pushed and used for workflow dispatch
  --help                                Show this help

Default behavior:
  1. run pnpm release:auto for a full public workspace beta batch
  2. create a release commit if version/changelog files changed
  3. push the current branch and local tags
  4. if go-usb-ai is in the batch, trigger the beta runtime update workflow
  5. wait for workflow success and verify release assets + public beta manifests
`.trim());
}

function parseArgs(argv) {
  const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;
  const options = {
    branch: null,
    dryRun: false,
    help: false,
    minimumLauncherVersionOverride: null,
    releaseTag: null,
    skipRuntimeChannel: false
  };

  for (let index = 0; index < normalizedArgv.length; index += 1) {
    const arg = normalizedArgv[index];
    switch (arg) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--skip-runtime-channel":
        options.skipRuntimeChannel = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--release-tag":
        options.releaseTag = normalizedArgv[index + 1] ?? null;
        index += 1;
        break;
      case "--minimum-launcher-version-override":
        options.minimumLauncherVersionOverride = normalizedArgv[index + 1] ?? null;
        index += 1;
        break;
      case "--branch":
        options.branch = normalizedArgv[index + 1] ?? null;
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.releaseTag === "") {
    options.releaseTag = null;
  }
  if (options.minimumLauncherVersionOverride === "") {
    options.minimumLauncherVersionOverride = null;
  }
  if (options.branch === "") {
    options.branch = null;
  }

  return options;
}

function run(command, args, options = {}) {
  const { capture = false, stdio = "inherit" } = options;
  return execFileSync(command, args, {
    cwd: ROOT_DIR,
    encoding: capture ? "utf8" : undefined,
    stdio: capture ? ["ignore", "pipe", "pipe"] : stdio
  });
}

function readJsonCommand(command, args) {
  const output = run(command, args, { capture: true });
  return JSON.parse(output);
}

function readGitStatus() {
  return run("git", ["status", "--short"], { capture: true }).trim();
}

function ensureCleanWorktree() {
  const status = readGitStatus();
  if (status.length > 0) {
    throw new Error(
      "release:beta requires a clean worktree before it starts. Commit or stash unrelated changes first."
    );
  }
}

function readCurrentBranch() {
  return run("git", ["rev-parse", "--abbrev-ref", "HEAD"], { capture: true }).trim();
}

function ensureBetaPreMode() {
  const preStatePath = join(ROOT_DIR, ".changeset", "pre.json");
  const preState = JSON.parse(readFileSync(preStatePath, "utf8"));
  if (preState?.mode !== "pre" || preState?.tag !== BETA_CHANNEL) {
    throw new Error("release:beta requires .changeset/pre.json to be in beta pre mode.");
  }
}

function ensureCommandAvailable(command, args = ["--version"]) {
  try {
    run(command, args, { capture: true });
  } catch {
    throw new Error(`Required command is unavailable: ${command}`);
  }
}

function commitReleaseArtifactsIfNeeded() {
  const status = readGitStatus();
  if (status.length === 0) {
    return null;
  }

  run("git", ["add", "-A"]);
  run("git", ["commit", "-m", "chore: release beta batch"]);
  return run("git", ["rev-parse", "HEAD"], { capture: true }).trim();
}

function readLatestCheckpointBatch() {
  const latestCheckpoint = readLatestReleaseCheckpoint();
  if (!latestCheckpoint) {
    throw new Error("release:beta could not find the latest release checkpoint after publish.");
  }

  return latestCheckpoint.checkpoint;
}

function readGoUsbAiVersionFromCheckpoint(checkpoint) {
  const packageState = checkpoint?.packages?.go-usb-ai;
  return typeof packageState?.version === "string" ? packageState.version : null;
}

function buildReleaseTagsFromCheckpoint(checkpoint) {
  const packages = checkpoint?.packages;
  if (!packages || typeof packages !== "object") {
    return [];
  }

  return Object.entries(packages)
    .map(([packageName, packageState]) => {
      const version =
        packageState && typeof packageState === "object" ? packageState.version : null;
      return typeof version === "string" ? `${packageName}@${version}` : null;
    })
    .filter(Boolean)
    .sort();
}

function pushReleaseState(branch, checkpoint) {
  run("git", ["push", "origin", `HEAD:${branch}`]);
  const releaseTags = buildReleaseTagsFromCheckpoint(checkpoint);
  if (releaseTags.length === 0) {
    return;
  }
  run("git", [
    "push",
    "origin",
    ...releaseTags.map((tag) => `refs/tags/${tag}`)
  ]);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForWorkflowRun(branch, startedAtMs) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const runs = readJsonCommand("gh", [
      "run",
      "list",
      "--repo",
      REPO,
      "--workflow",
      RUNTIME_WORKFLOW,
      "--branch",
      branch,
      "--limit",
      "20",
      "--json",
      "databaseId,createdAt,event,headBranch,status,conclusion,url"
    ]);
    const matchingRun = runs.find((entry) => {
      const createdAtMs = Date.parse(entry.createdAt ?? "");
      return (
        entry.event === "workflow_dispatch" &&
        entry.headBranch === branch &&
        Number.isFinite(createdAtMs) &&
        createdAtMs >= startedAtMs - 60_000
      );
    });
    if (matchingRun) {
      return matchingRun;
    }
    await sleep(5000);
  }

  throw new Error(`Timed out waiting for ${RUNTIME_WORKFLOW} to appear on branch ${branch}.`);
}

function triggerRuntimeWorkflow({ branch, minimumLauncherVersionOverride, releaseTag }) {
  const args = [
    "workflow",
    "run",
    RUNTIME_WORKFLOW,
    "--repo",
    REPO,
    "--ref",
    branch,
    "-f",
    `channel=${BETA_CHANNEL}`,
    "-f",
    `release_tag=${releaseTag}`
  ];
  if (minimumLauncherVersionOverride) {
    args.push("-f", `minimum_launcher_version_override=${minimumLauncherVersionOverride}`);
  }
  run("gh", args);
}

function watchWorkflowRun(runId) {
  run("gh", ["run", "watch", String(runId), "--repo", REPO, "--exit-status"]);
  const runSummary = readJsonCommand("gh", [
    "run",
    "view",
    String(runId),
    "--repo",
    REPO,
    "--json",
    "status,conclusion,url"
  ]);
  if (runSummary.status !== "completed" || runSummary.conclusion !== "success") {
    throw new Error(`Runtime workflow did not finish successfully: ${runSummary.url}`);
  }
  return runSummary;
}

function verifyRuntimeReleaseAssets(releaseTag, go-usb-aiVersion) {
  const releaseSummary = readJsonCommand("gh", [
    "release",
    "view",
    releaseTag,
    "--repo",
    REPO,
    "--json",
    "url,isPrerelease,assets"
  ]);
  const assetNames = new Set((releaseSummary.assets ?? []).map((asset) => asset.name));
  for (const target of RUNTIME_MANIFEST_TARGETS) {
    const expectedAssetName = `go-usb-ai-runtime-${target.platform}-${target.arch}-${go-usb-aiVersion}.zip`;
    if (!assetNames.has(expectedAssetName)) {
      throw new Error(`Missing runtime bundle asset on release ${releaseTag}: ${expectedAssetName}`);
    }
  }
  return releaseSummary;
}

async function verifyPublicBetaManifests(go-usb-aiVersion) {
  return verifyPublicRuntimeManifests({
    channel: BETA_CHANNEL,
    expectedVersion: go-usb-aiVersion,
    readJsonCommand,
    repo: REPO,
    run,
    sleep,
    targets: RUNTIME_MANIFEST_TARGETS
  });
}

function buildDryRunPlan(branch, options) {
  return [
    `- channel: ${BETA_CHANNEL}`,
    `- branch: ${branch}`,
    `- command: pnpm release:auto (full public workspace beta batch)`,
    `- commit release artifacts if version/changelog files changed`,
    `- push branch and tags`,
    options.skipRuntimeChannel
      ? "- runtime update channel: skipped by flag"
      : "- runtime update channel: trigger workflow + wait + verify if go-usb-ai is in the batch"
  ];
}

function ensureLocalReleaseCommandPrerequisites() {
  ensureCommandAvailable("pnpm", ["--version"]);
  ensureCleanWorktree();
}

function ensureRuntimeReleaseCommandPrerequisites() {
  ensureCommandAvailable("gh");
  ensureCommandAvailable("curl", ["--version"]);
}

function runLocalBetaRelease(branch) {
  run("pnpm", ["release:auto"]);
  const checkpoint = readLatestCheckpointBatch();
  const go-usb-aiVersion = readGoUsbAiVersionFromCheckpoint(checkpoint);
  const releaseCommit = commitReleaseArtifactsIfNeeded();
  pushReleaseState(branch, checkpoint);
  return {
    go-usb-aiVersion,
    releaseCommit
  };
}

async function runRuntimeReleaseClosure(branch, go-usb-aiVersion, options) {
  if (options.skipRuntimeChannel || !go-usb-aiVersion) {
    return {
      publicManifestSummary: null,
      runtimeReleaseSummary: null,
      runtimeRunSummary: null
    };
  }

  ensureRuntimeReleaseCommandPrerequisites();
  const releaseTag = options.releaseTag ?? `go-usb-ai@${go-usb-aiVersion}`;
  const dispatchStartedAtMs = Date.now();
  triggerRuntimeWorkflow({
    branch,
    minimumLauncherVersionOverride: options.minimumLauncherVersionOverride,
    releaseTag
  });
  const workflowRun = await waitForWorkflowRun(branch, dispatchStartedAtMs);
  const runtimeRunSummary = watchWorkflowRun(workflowRun.databaseId);
  const runtimeReleaseSummary = verifyRuntimeReleaseAssets(releaseTag, go-usb-aiVersion);
  const publicManifestSummary = await verifyPublicBetaManifests(go-usb-aiVersion);
  return {
    publicManifestSummary,
    runtimeReleaseSummary,
    runtimeRunSummary
  };
}

function printCompletionSummary({
  branch,
  go-usb-aiVersion,
  publicManifestSummary,
  releaseCommit,
  runtimeReleaseSummary,
  runtimeRunSummary
}) {
  console.log("release:beta completed");
  console.log(`- branch: ${branch}`);
  console.log(`- release commit: ${releaseCommit ?? "no local release artifact diff"}`);
  console.log(`- go-usb-ai in batch: ${go-usb-aiVersion ? `yes (${go-usb-aiVersion})` : "no"}`);
  if (runtimeRunSummary) {
    console.log(`- runtime workflow: ${runtimeRunSummary.url}`);
  }
  if (runtimeReleaseSummary) {
    console.log(`- runtime release: ${runtimeReleaseSummary.url}`);
  }
  if (publicManifestSummary) {
    console.log(`- runtime manifest verification: ${publicManifestSummary.source} (${publicManifestSummary.pagesStatus})`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  ensureBetaPreMode();
  const branch = options.branch ?? readCurrentBranch();
  const planLines = buildDryRunPlan(branch, options);

  if (options.dryRun) {
    console.log("release:beta dry run");
    console.log(planLines.join("\n"));
    return;
  }

  ensureLocalReleaseCommandPrerequisites();
  const { go-usb-aiVersion, releaseCommit } = runLocalBetaRelease(branch);
  const { publicManifestSummary, runtimeReleaseSummary, runtimeRunSummary } = await runRuntimeReleaseClosure(
    branch,
    go-usb-aiVersion,
    options
  );

  printCompletionSummary({
    branch,
    go-usb-aiVersion,
    publicManifestSummary,
    releaseCommit,
    runtimeReleaseSummary,
    runtimeRunSummary
  });
}

try {
  await main();
} catch (error) {
  console.error(
    `[release:beta] ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
}
