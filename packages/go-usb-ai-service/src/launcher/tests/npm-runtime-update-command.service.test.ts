import { describe, expect, it } from "vitest";
import { NpmRuntimeUpdateCommandService } from "../npm-runtime-update-command.service.js";
import { GoUsbAiDistributionService } from "@go-usb-ai-service/shared/services/runtime/go-usb-ai-distribution.service.js";

describe("NpmRuntimeUpdateCommandService", () => {
  it("blocks npm runtime updates from the desktop command surface", async () => {
    GoUsbAiDistributionService.configure({
      version: "0.19.26",
      packageRoot: "/runtime",
      appEntrypoint: "/runtime/dist/cli/app/index.js",
      uiDistDir: "/runtime/ui-dist",
      runtimeUpdatePublicKeyPath: "/runtime/resources/update-bundle-public.pem"
    });

    const snapshot = await new NpmRuntimeUpdateCommandService({
      GOUSB_AI_DESKTOP_COMMAND_SURFACE: "1"
    }).runManaged({ check: true, json: true });

    expect(snapshot).toMatchObject({
      status: "blocked",
      installationKind: "desktop-bundle",
      currentVersion: "0.19.26",
      blockReason: "unsupported-installation",
      canApplyInApp: false
    });
  });
});
