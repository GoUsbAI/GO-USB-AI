import assert from "node:assert/strict";
import test from "node:test";
import { createRuntimeScriptSpawnOptions } from "../runtime-service";
import { createDesktopRuntimeEnv } from "../utils/desktop-paths.utils";

test("hides runtime child process console windows on Windows", () => {
  const env = { GOUSB_AI_HOME: "/tmp/go-usb-ai" };

  assert.deepEqual(createRuntimeScriptSpawnOptions(env), {
    env,
    stdio: "pipe",
    windowsHide: true
  });
});

test("desktop runtime disables duplicate built-in extension child processes", () => {
  const runtimeEnv = createDesktopRuntimeEnv({
    GOUSB_AI_HOME: "/tmp/ambient",
    GOUSB_AI_COMMAND_SURFACE_BIN: "/tmp/go-usb-ai-command-surface/bin"
  });

  assert.equal(runtimeEnv.GOUSB_AI_DISABLE_BUILTIN_EXTENSIONS, "1");
  assert.equal(runtimeEnv.ELECTRON_RUN_AS_NODE, "1");
  assert.equal(runtimeEnv.GOUSB_AI_COMMAND_SURFACE_BIN, "/tmp/go-usb-ai-command-surface/bin");
});
