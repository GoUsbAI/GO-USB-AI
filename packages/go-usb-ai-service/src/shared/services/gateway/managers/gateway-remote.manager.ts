import type { UiRemoteAccessHost } from "@go-usb-ai/server";
import type { RemoteRuntimeState } from "@go-usb-ai/remote";
import type { ConfigManager } from "@go-usb-ai/kernel";
import type { Config } from "@go-usb-ai/core";
import { createManagedRemoteModuleForUi } from "@go-usb-ai-service/shared/services/runtime/utils/service-remote-runtime.utils.js";
import { createRemoteAccessHost } from "@go-usb-ai-service/shared/services/ui/service-remote-access.service.js";
import type { GatewayRuntimeDeps } from "../go-usb-ai-gateway-runtime.service.js";

type RemoteServiceModule = ReturnType<typeof createManagedRemoteModuleForUi>;

export class GatewayRemoteManager {
  readonly remoteModule: RemoteServiceModule;
  readonly remoteAccess: UiRemoteAccessHost;

  constructor(params: {
    deps: GatewayRuntimeDeps;
    configManager: ConfigManager;
    uiConfig: Config["ui"];
    onRemoteStateChange?: (state: RemoteRuntimeState) => void;
  }) {
    const { configManager, deps, uiConfig } = params;
    this.remoteModule = createManagedRemoteModuleForUi({
      loadConfig: configManager.loadConfig,
      uiConfig,
      onRemoteStateChange: params.onRemoteStateChange,
    });
    this.remoteAccess = createRemoteAccessHost({
      serviceCommands: deps,
      requestRestart: deps.requestRestart,
      uiConfig,
      remoteModule: this.remoteModule,
    });
  }

  stop = async (): Promise<void> => {
    await this.remoteModule?.stop();
  };
}
