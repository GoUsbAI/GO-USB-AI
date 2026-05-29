export const ENV_APP_NAME_KEY = "GOUSB_AI_APP_NAME";
export const ENV_HOME_KEY = "GOUSB_AI_HOME";
export const DEFAULT_HOME_DIR = ".go-usb-ai";

const envAppName = process.env[ENV_APP_NAME_KEY]?.trim();
export const APP_NAME = envAppName && envAppName.length > 0 ? envAppName : "go-usb-ai";
export const APP_TITLE = `${APP_NAME.slice(0, 1).toUpperCase()}${APP_NAME.slice(1)}`;
