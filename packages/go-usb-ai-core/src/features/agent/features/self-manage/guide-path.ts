import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

function resolveExistingPath(candidates: Array<string | null | undefined>): string | null {
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function resolveGoUsbAiSelfManageGuidePaths(): { primaryPath: string | null; repoDocsPath: string | null } {
  const override = process.env.GOUSB_AI_USAGE_GUIDE_PATH?.trim();
  const agentDir = fileURLToPath(new URL(".", import.meta.url));
  const repoPackagedGuide = resolve(agentDir, "..", "..", "..", "go-usb-ai", "resources", "USAGE.md");
  const repoDocsGuide = resolve(agentDir, "..", "..", "..", "..", "docs", "USAGE.md");
  let installedGuide: string | null = null;

  if (override && existsSync(override)) {
    return { primaryPath: override, repoDocsPath: null };
  }

  try {
    const packageEntry = require.resolve("go-usb-ai");
    const packageRoot = resolve(dirname(packageEntry), "..");
    const packagedGuide = resolve(packageRoot, "resources", "USAGE.md");
    if (existsSync(packagedGuide)) {
      installedGuide = packagedGuide;
    }
  } catch {
    installedGuide = null;
  }

  const primaryPath = resolveExistingPath([installedGuide, repoPackagedGuide, repoDocsGuide]);
  const repoDocsPath = primaryPath === repoDocsGuide || !existsSync(repoDocsGuide) ? null : repoDocsGuide;
  return { primaryPath, repoDocsPath };
}
