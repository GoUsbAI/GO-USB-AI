import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

type GoUsbAiConfig = {
  providers?: Record<string, {
    apiKey?: string;
    apiBase?: string | null;
  } | undefined>;
};

export type PlatformPublishAuthState = {
  token: string | null;
  apiBaseUrl?: string;
};

const GOUSB_AI_HOME_ENV_KEY = "GOUSB_AI_HOME";
const GOUSB_AI_DEFAULT_HOME_DIR = ".go-usb-ai";

export class PlatformAuthStateService {
  readCurrentAuthState = (): PlatformPublishAuthState => {
    const configPath = this.resolveConfigPath();
    if (!existsSync(configPath)) {
      return {
        token: null,
      };
    }
    try {
      const raw = readFileSync(configPath, "utf-8");
      const parsed = JSON.parse(raw) as GoUsbAiConfig;
      const provider = parsed.providers?.go-usb-ai;
      const token = typeof provider?.apiKey === "string" && provider.apiKey.trim().length > 0
        ? provider.apiKey.trim()
        : null;
      const apiBase = typeof provider?.apiBase === "string" && provider.apiBase.trim().length > 0
        ? provider.apiBase.trim()
        : undefined;
      return {
        token,
        apiBaseUrl: apiBase,
      };
    } catch {
      return {
        token: null,
      };
    }
  };

  private resolveConfigPath = (): string => {
    const goUsbAiHome = process.env[GOUSB_AI_HOME_ENV_KEY]?.trim();
    const dataHome = goUsbAiHome && goUsbAiHome.length > 0
      ? resolve(goUsbAiHome)
      : resolve(homedir(), GOUSB_AI_DEFAULT_HOME_DIR);
    return resolve(dataHome, "config.json");
  };
}
