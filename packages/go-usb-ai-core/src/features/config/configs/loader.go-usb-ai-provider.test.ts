import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { loadConfig } from "./loader.js";

describe("loadConfig go-usb-ai built-in provider bootstrap", () => {
  it("auto-generates and persists a disabled go-usb-ai provider for empty config", () => {
    const dir = mkdtempSync(join(tmpdir(), "go-usb-ai-config-go-usb-ai-"));
    const configPath = join(dir, "config.json");

    const first = loadConfig(configPath);
    const second = loadConfig(configPath);

    expect(first.providers["go-usb-ai"].enabled).toBe(false);
    expect(first.providers["go-usb-ai"].apiKey).toMatch(/^nc_free_/);
    expect(second.providers["go-usb-ai"].enabled).toBe(false);
    expect(second.providers["go-usb-ai"].apiKey).toBe(first.providers["go-usb-ai"].apiKey);
  });

  it("migrates legacy brave web search config into the new search config", () => {
    const dir = mkdtempSync(join(tmpdir(), "go-usb-ai-config-search-"));
    const configPath = join(dir, "config.json");

    writeFileSync(configPath, JSON.stringify({
      tools: {
        web: {
          search: {
            apiKey: "brave_legacy_key",
            maxResults: 7
          }
        }
      }
    }, null, 2));

    const config = loadConfig(configPath);

    expect(config.search.provider).toBe("bocha");
    expect(config.search.enabledProviders).toEqual(["bocha"]);
    expect(config.search.defaults.maxResults).toBe(7);
    expect(config.search.providers.brave.apiKey).toBe("brave_legacy_key");
  });

  it("preserves tavily as an enabled provider when loading persisted config", () => {
    const dir = mkdtempSync(join(tmpdir(), "go-usb-ai-config-tavily-"));
    const configPath = join(dir, "config.json");

    writeFileSync(configPath, JSON.stringify({
      search: {
        provider: "tavily",
        enabledProviders: ["tavily"],
        defaults: {
          maxResults: 6
        },
        providers: {
          tavily: {
            apiKey: "tvly_test_key",
            baseUrl: "https://api.tavily.com/search",
            searchDepth: "advanced",
            includeAnswer: true
          }
        }
      }
    }, null, 2));

    const config = loadConfig(configPath);

    expect(config.search.provider).toBe("tavily");
    expect(config.search.enabledProviders).toEqual(["tavily"]);
    expect(config.search.defaults.maxResults).toBe(6);
    expect(config.search.providers.tavily.apiKey).toBe("tvly_test_key");
    expect(config.search.providers.tavily.searchDepth).toBe("advanced");
    expect(config.search.providers.tavily.includeAnswer).toBe(true);
  });

  it("does not overwrite an existing invalid config file with defaults", () => {
    const dir = mkdtempSync(join(tmpdir(), "go-usb-ai-config-invalid-"));
    const configPath = join(dir, "config.json");
    const invalidConfig = {
      search: {
        provider: "invalid-provider"
      }
    };

    writeFileSync(configPath, JSON.stringify(invalidConfig, null, 2));

    const config = loadConfig(configPath);
    const rawAfterLoad = readFileSync(configPath, "utf-8");

    expect(config.search.provider).toBe("bocha");
    expect(JSON.parse(rawAfterLoad)).toEqual(invalidConfig);
  });
});
