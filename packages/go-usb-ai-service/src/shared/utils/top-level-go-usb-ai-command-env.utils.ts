import { createExternalCommandEnv } from "@go-usb-ai/core";

const GOUSB_AI_RUNTIME_BUNDLE_ENV_KEYS = [
  "GOUSB_AI_RUNTIME_BUNDLE_CHILD",
  "GOUSB_AI_DISABLE_RUNTIME_BUNDLE_LAUNCHER",
] as const;

export function createTopLevelGoUsbAiCommandEnv(
  baseEnv: NodeJS.ProcessEnv = process.env,
  extraEnv: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
  const env = createExternalCommandEnv(baseEnv, extraEnv);
  for (const key of GOUSB_AI_RUNTIME_BUNDLE_ENV_KEYS) {
    delete env[key];
  }
  return env;
}
