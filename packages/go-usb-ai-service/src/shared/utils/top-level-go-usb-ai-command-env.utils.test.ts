import { describe, expect, it } from "vitest";
import { createTopLevelGoUsbAiCommandEnv } from "./top-level-go-usb-ai-command-env.utils.js";

describe("createTopLevelGoUsbAiCommandEnv", () => {
  it("removes runtime bundle relaunch markers", () => {
    const env = createTopLevelGoUsbAiCommandEnv({
      PATH: process.env.PATH,
      GOUSB_AI_RUNTIME_BUNDLE_CHILD: "1",
      GOUSB_AI_DISABLE_RUNTIME_BUNDLE_LAUNCHER: "1",
      KEEP_ME: "ok",
    });

    expect(env.GOUSB_AI_RUNTIME_BUNDLE_CHILD).toBeUndefined();
    expect(env.GOUSB_AI_DISABLE_RUNTIME_BUNDLE_LAUNCHER).toBeUndefined();
    expect(env.KEEP_ME).toBe("ok");
  });
});
