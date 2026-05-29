import { existsSync } from "node:fs";
import { getConfigPath, loadConfig } from "@go-usb-ai/core";

export function initializeConfigIfMissing(configPath = getConfigPath()): boolean {
  if (existsSync(configPath)) {
    return false;
  }
  loadConfig(configPath);
  return true;
}
