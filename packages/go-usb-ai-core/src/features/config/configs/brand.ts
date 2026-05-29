import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

export const ENV_APP_NAME_KEY = "GOUSB_AI_APP_NAME";
const envAppName = process.env[ENV_APP_NAME_KEY]?.trim();
export const APP_NAME = envAppName && envAppName.length > 0 ? envAppName : "go-usb-ai";
export const APP_TAGLINE = "Personal AI Assistant";
export const APP_TITLE = `${APP_NAME.slice(0, 1).toUpperCase()}${APP_NAME.slice(1)}`;

export const ENV_HOME_KEY = "GOUSB_AI_HOME";
export const DEFAULT_HOME_DIR = ".go-usb-ai";
export const DEFAULT_CONFIG_FILE = "config.json";
export const DEFAULT_WORKSPACE_DIR = "workspace";
export const DEFAULT_SKILLS_DIR = "skills";
export const DEFAULT_CONFIG_PATH = `~/${DEFAULT_HOME_DIR}/${DEFAULT_CONFIG_FILE}`;
export const DEFAULT_WORKSPACE_PATH = `~/${DEFAULT_HOME_DIR}/${DEFAULT_WORKSPACE_DIR}`;

// For portable mode, use relative workspace path
function getExecutableDir(): string | null {
  try {
    const path = process.execPath || "";
    if (path) {
      return dirname(path);
    }
    return null;
  } catch {
    return null;
  }
}

function isPortableMode(): boolean {
  const execDir = getExecutableDir();
  if (execDir) {
    const portableMarker = resolve(execDir, ".portable");
    return existsSync(portableMarker);
  }
  // Also check if running from project root (dev mode)
  try {
    const cwd = process.cwd();
    const portableMarker = resolve(cwd, ".portable");
    return existsSync(portableMarker);
  } catch {
    return false;
  }
}

export function getDefaultWorkspacePath(): string {
  if (isPortableMode()) {
    return "./workspace";
  }
  return DEFAULT_WORKSPACE_PATH;
}

export const APP_USER_AGENT = APP_NAME;
export const APP_REPLY_SUBJECT = `${APP_NAME} reply`;
export const SKILL_METADATA_KEY = "go-usb-ai";
