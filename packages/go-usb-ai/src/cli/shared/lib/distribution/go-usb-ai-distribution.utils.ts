import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { GoUsbAiDistribution } from "@go-usb-ai/service";

export function createGoUsbAiDistribution(importMetaUrl: string): GoUsbAiDistribution {
  const packageRoot = resolve(dirname(fileURLToPath(importMetaUrl)), "../../..");
  const { version } = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf-8")) as { version?: string };
  return {
    version: typeof version === "string" ? version : "0.0.0",
    packageRoot,
    appEntrypoint: resolve(packageRoot, "dist/cli/app/index.js"),
    uiDistDir: resolve(packageRoot, "ui-dist"),
    runtimeUpdatePublicKeyPath: resolve(packageRoot, "resources/update-bundle-public.pem")
  };
}
