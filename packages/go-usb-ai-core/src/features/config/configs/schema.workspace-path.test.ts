import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_WORKSPACE_DIR, DEFAULT_WORKSPACE_PATH } from "./brand.js";
import { ConfigSchema, getWorkspacePathFromConfig } from "./schema.js";

const tempDirs: string[] = [];
const originalHome = process.env.GOUSB_AI_HOME;

function createTempHome(): string {
  const dir = mkdtempSync(join(tmpdir(), "go-usb-ai-workspace-path-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  if (typeof originalHome === "string") {
    process.env.GOUSB_AI_HOME = originalHome;
  } else {
    delete process.env.GOUSB_AI_HOME;
  }
});

describe("getWorkspacePathFromConfig", () => {
  it("resolves the default workspace under GOUSB_AI_HOME", () => {
    const home = createTempHome();
    process.env.GOUSB_AI_HOME = home;
    const config = ConfigSchema.parse({});

    expect(config.agents.defaults.workspace).toBe(DEFAULT_WORKSPACE_PATH);
    expect(getWorkspacePathFromConfig(config)).toBe(join(home, DEFAULT_WORKSPACE_DIR));
  });

  it("keeps explicit workspace overrides", () => {
    const home = createTempHome();
    const explicitWorkspace = join(createTempHome(), "custom-workspace");
    process.env.GOUSB_AI_HOME = home;
    const config = ConfigSchema.parse({
      agents: {
        defaults: {
          workspace: explicitWorkspace,
        },
      },
    });

    expect(getWorkspacePathFromConfig(config)).toBe(explicitWorkspace);
  });
});
