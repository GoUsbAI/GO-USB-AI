import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ConfigSchema, saveConfig } from "@go-usb-ai/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as utils from "../../../shared/utils/cli.utils.js";
import { PlatformAuthCommands } from "./platform-auth-commands.service.js";

const originalGoUsbAiHome = process.env.GOUSB_AI_HOME;

function createJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("PlatformAuthCommands login", () => {
  let tempHome = "";

  beforeEach(() => {
    tempHome = mkdtempSync(join(tmpdir(), "go-usb-ai-platform-auth-test-"));
    process.env.GOUSB_AI_HOME = tempHome;
    saveConfig(ConfigSchema.parse({
      providers: {
        go-usb-ai: {
          apiBase: "https://ai-gateway-api.go-usb-ai.io/v1",
          apiKey: ""
        }
      }
    }));
  });

  afterEach(() => {
    if (originalGoUsbAiHome) {
      process.env.GOUSB_AI_HOME = originalGoUsbAiHome;
    } else {
      delete process.env.GOUSB_AI_HOME;
    }
    if (tempHome) {
      rmSync(tempHome, { recursive: true, force: true });
      tempHome = "";
    }
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses browser sign-in by default, opens the browser, and waits until authorization completes", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createJsonResponse({
        ok: true,
        data: {
          sessionId: "session-1",
          verificationUri: "https://platform.example.com/platform/auth/browser?sessionId=session-1",
          expiresAt: "2026-04-16T08:30:00.000Z",
          intervalMs: 1000
        }
      }))
      .mockResolvedValueOnce(createJsonResponse({
        ok: true,
        data: {
          status: "pending",
          nextPollMs: 1000
        }
      }))
      .mockResolvedValueOnce(createJsonResponse({
        ok: true,
        data: {
          status: "authorized",
          token: "token-1",
          user: {
            id: "user-1",
            email: "bot@example.com",
            role: "user",
            username: null
          }
        }
      }));
    vi.stubGlobal("fetch", fetchMock);
    const openBrowserSpy = vi.spyOn(utils, "openBrowser").mockReturnValue(true);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const commands = new PlatformAuthCommands();

    const loginPromise = commands.login({
      apiBase: "https://ai-gateway-api.go-usb-ai.io/v1"
    });

    await vi.advanceTimersByTimeAsync(1000);
    await loginPromise;

    expect(openBrowserSpy).toHaveBeenCalledWith(
      "https://platform.example.com/platform/auth/browser?sessionId=session-1"
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://ai-gateway-api.go-usb-ai.io/platform/auth/browser/start",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://ai-gateway-api.go-usb-ai.io/platform/auth/browser/poll",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("GoUsbAi browser sign-in"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Waiting for authorization until"));
    expect(logSpy).toHaveBeenCalledWith("✓ Browser authorization completed.");
    expect(logSpy).toHaveBeenCalledWith("✓ Account: bot@example.com (user)");
  });

  it("does not try to open the browser when --no-open is used", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createJsonResponse({
        ok: true,
        data: {
          sessionId: "session-2",
          verificationUri: "https://platform.example.com/platform/auth/browser?sessionId=session-2",
          expiresAt: "2026-04-16T08:30:00.000Z",
          intervalMs: 1000
        }
      }))
      .mockResolvedValueOnce(createJsonResponse({
        ok: true,
        data: {
          status: "authorized",
          token: "token-2",
          user: {
            id: "user-2",
            email: "server@example.com",
            role: "user",
            username: null
          }
        }
      }));
    vi.stubGlobal("fetch", fetchMock);
    const openBrowserSpy = vi.spyOn(utils, "openBrowser").mockReturnValue(true);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const commands = new PlatformAuthCommands();

    await commands.login({
      apiBase: "https://ai-gateway-api.go-usb-ai.io/v1",
      open: false
    });

    expect(openBrowserSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      "Automatic browser opening is disabled. Open the link above in any browser to continue."
    );
  });

  it("keeps the direct password flow when credentials are supplied", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(createJsonResponse({
      ok: true,
      data: {
        token: "token-3",
        user: {
          id: "user-3",
          email: "direct@example.com",
          role: "admin",
          username: null
        }
      }
    }));
    vi.stubGlobal("fetch", fetchMock);
    const openBrowserSpy = vi.spyOn(utils, "openBrowser").mockReturnValue(true);
    const commands = new PlatformAuthCommands();

    await commands.login({
      apiBase: "https://ai-gateway-api.go-usb-ai.io/v1",
      email: "direct@example.com",
      password: "secret"
    });

    expect(openBrowserSpy).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ai-gateway-api.go-usb-ai.io/platform/auth/login",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  it("prints account readiness with exact web and CLI guidance when username is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(createJsonResponse({
      ok: true,
      data: {
        user: {
          id: "user-4",
          email: "publisher@example.com",
          role: "user",
          username: null
        }
      }
    }));
    vi.stubGlobal("fetch", fetchMock);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const commands = new PlatformAuthCommands();

    await commands.accountStatus({
      apiBase: "https://ai-gateway-api.go-usb-ai.io/v1"
    });

    expect(logSpy).toHaveBeenCalledWith("GoUsbAi account status");
    expect(logSpy).toHaveBeenCalledWith("Username: (not set)");
    expect(logSpy).toHaveBeenCalledWith("GoUsbAi Web account settings: https://platform.go-usb-ai.io/account");
    expect(logSpy).toHaveBeenCalledWith("CLI fallback: go-usb-ai account set-username <username>");
  });

  it("updates username and prints the unlocked personal publish scope", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(createJsonResponse({
      ok: true,
      data: {
        token: "token-4",
        user: {
          id: "user-5",
          email: "publisher@example.com",
          role: "user",
          username: "alice-dev"
        }
      }
    }));
    vi.stubGlobal("fetch", fetchMock);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const commands = new PlatformAuthCommands();

    await commands.accountSetUsername({
      apiBase: "https://ai-gateway-api.go-usb-ai.io/v1",
      username: "alice-dev"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://ai-gateway-api.go-usb-ai.io/platform/auth/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          username: "alice-dev"
        })
      })
    );
    expect(logSpy).toHaveBeenCalledWith("✓ Username saved: alice-dev");
    expect(logSpy).toHaveBeenCalledWith("✓ Personal publish scope: @alice-dev/*");
  });
});
