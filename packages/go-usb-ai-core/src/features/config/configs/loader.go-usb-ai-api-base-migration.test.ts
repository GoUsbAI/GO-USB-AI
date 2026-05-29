import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { loadConfig } from "./loader.js";

describe("go-usb-ai apiBase migration", () => {
  it("migrates legacy go-usb-ai api base to ai-gateway-api domain", () => {
    const dir = mkdtempSync(join(tmpdir(), "go-usb-ai-config-go-usb-ai-base-"));
    const configPath = join(dir, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          providers: {
            "go-usb-ai": {
              apiBase: "https://api.go-usb-ai.io/v1",
              apiKey: "nc_free_test"
            }
          }
        },
        null,
        2
      )
    );

    const config = loadConfig(configPath);
    expect(config.providers["go-usb-ai"].apiBase).toBe("https://ai-gateway-api.go-usb-ai.io/v1");
  });
});
