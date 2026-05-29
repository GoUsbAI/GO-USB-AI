import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initializeConfigIfMissing } from "./runtime-config-init.service.js";

describe("initializeConfigIfMissing", () => {
  it("creates a config with the built-in go-usb-ai provider disabled by default", () => {
    const dir = mkdtempSync(join(tmpdir(), "go-usb-ai-runtime-init-"));
    const configPath = join(dir, "config.json");

    expect(initializeConfigIfMissing(configPath)).toBe(true);

    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      providers: {
        go-usb-ai: {
          enabled: boolean;
          apiKey: string;
        };
      };
    };

    expect(config.providers.go-usb-ai.enabled).toBe(false);
    expect(config.providers.go-usb-ai.apiKey).toMatch(/^nc_free_/);
    expect(initializeConfigIfMissing(configPath)).toBe(false);
  });
});
