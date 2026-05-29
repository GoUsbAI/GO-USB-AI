import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import { EventBus, type Ingress } from "@go-usb-ai/shared";
import { createUiRouter } from "@go-usb-ai-server/app/router.js";
import type { UiKernelHost } from "@go-usb-ai-server/app/types/router-options.types.js";

describe("ingress route", () => {
  it("passes webhook envelopes to the shared ingress", async () => {
    const handle = vi.fn(() => ({ accepted: true }));
    const app = createUiRouter({
      configPath: join(tmpdir(), "go-usb-ai-router-ingress-test.json"),
      appEventBus: {} as EventBus,
      kernel: {
        assetStore: {} as never,
        eventBus: new EventBus(),
        ingress: { handle } as unknown as Ingress,
        listSessionTypes: async () => ({ defaultType: "native", options: [] }),
        llmProviders: {} as never,
        ncpSessionManager: {} as never,
      } as unknown as UiKernelHost,
    });

    const response = await app.request("http://localhost/webhook", {
      method: "POST",
      headers: {
        authorization: "Bearer secret-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "test.ping",
        payload: { value: 1 },
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { accepted: true },
    });
    expect(handle).toHaveBeenCalledWith(
      { type: "test.ping", payload: { value: 1 } },
      { source: "webhook", token: "secret-token" },
    );
  });
});
