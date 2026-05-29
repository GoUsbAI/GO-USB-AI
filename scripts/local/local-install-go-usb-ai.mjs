#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { resolveRepoPath } from "../shared/repo-paths.mjs";

const rootDir = resolveRepoPath(import.meta.url);
const packageDir = resolve(rootDir, "packages/go-usb-ai");

function binName(name) {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

function run(command, args, options = {}) {
  console.log(`[local-install] run: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
    ...options
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function readStdout(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    env: process.env
  });
  if (result.status !== 0) {
    return "";
  }
  return result.stdout.trim();
}

function resolveGlobalGoUsbAiBin() {
  const globalPrefix = readStdout(binName("npm"), ["prefix", "--global"]);
  if (!globalPrefix) {
    return binName("go-usb-ai");
  }

  const candidate =
    process.platform === "win32"
      ? resolve(globalPrefix, binName("go-usb-ai"))
      : resolve(globalPrefix, "bin", "go-usb-ai");
  return existsSync(candidate) ? candidate : binName("go-usb-ai");
}

function createPnpmLinkEnv() {
  const globalPrefix = readStdout(binName("npm"), ["prefix", "--global"]);
  if (!globalPrefix) {
    return process.env;
  }

  const pnpmHome =
    process.platform === "win32" ? globalPrefix : resolve(globalPrefix, "bin");

  return {
    ...process.env,
    PNPM_HOME: pnpmHome,
    PATH: `${pnpmHome}${process.platform === "win32" ? ";" : ":"}${process.env.PATH ?? ""}`
  };
}

run(binName("pnpm"), ["-r", "--filter", "go-usb-ai...", "build"]);
run(binName("pnpm"), ["-C", "packages/go-usb-ai", "link", "--global"], {
  env: createPnpmLinkEnv()
});

const go-usb-aiBin = resolveGlobalGoUsbAiBin();
run(go-usb-aiBin, ["--version"]);
console.log(`[local-install] go-usb-ai is linked globally from: ${packageDir}`);
console.log(`[local-install] go-usb-ai binary is ready: ${go-usb-aiBin}`);
