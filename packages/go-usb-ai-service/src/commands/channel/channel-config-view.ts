import type { Config } from "@go-usb-ai/core";
import { toPluginConfigView, type PluginChannelBinding } from "@go-usb-ai/openclaw-compat";

export function resolveChannelConfigView(config: Config, bindings: PluginChannelBinding[]): Config {
  return toPluginConfigView(config, bindings) as Config;
}
