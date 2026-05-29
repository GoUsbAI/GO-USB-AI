import * as GoUsbAiCore from "@go-usb-ai/core";
import {
  GoUsbAiKernel,
  runGatewayInboundLoop,
  type AutomationManager,
  type ConfigManager,
  type LlmProviderManager,
} from "@go-usb-ai/kernel";
import type { EventBus, Ingress } from "@go-usb-ai/shared";
import {
  setPluginRuntimeBridge,
} from "@go-usb-ai/openclaw-compat";
import {
  startUiServer,
  type MarketplaceApiConfig,
  type UiRouterOptions,
  type UiRuntimeControlHost,
  type UiRuntimeUpdateHost,
} from "@go-usb-ai/server";
import { resolve } from "node:path";
import { setImmediate as waitForNextTick } from "node:timers/promises";
import { GatewayControllerImpl } from "@go-usb-ai-service/shared/controllers/gateway.controller.js";
import { GatewayPluginManager } from "@go-usb-ai-service/shared/services/gateway/managers/gateway-plugin.manager.js";
import { GatewayRemoteManager } from "@go-usb-ai-service/shared/services/gateway/managers/gateway-remote.manager.js";
import { GatewayRestartWakeService } from "@go-usb-ai-service/shared/services/gateway/gateway-restart-wake.service.js";
import { createCronJobHandler } from "@go-usb-ai-service/shared/services/gateway/utils/cron-job-handler.utils.js";
import { companionRuntimeService } from "@go-usb-ai-service/shared/services/ui/companion-runtime.service.js";
import { handleGatewayDeferredStartupError } from "@go-usb-ai-service/shared/services/gateway/utils/gateway-runtime-lifecycle.utils.js";
import { GoUsbAiApp, type UiStartupHandle } from "@go-usb-ai-service/shared/services/gateway/go-usb-ai-app.service.js";
import { GoUsbAiDistributionService } from "@go-usb-ai-service/shared/services/runtime/go-usb-ai-distribution.service.js";
import { ServiceBootstrapStatusStore } from "@go-usb-ai-service/shared/services/gateway/service-bootstrap-status.service.js";
import { ServiceFileWatcherRegistry, markLocalUiRuntimeIfStarted, startGatewayRuntimeSupport, watchServiceConfigFile } from "@go-usb-ai-service/shared/services/gateway/service-startup-support.service.js";
import { installPluginRuntimeBridge } from "@go-usb-ai-service/shared/services/plugin/utils/plugin-runtime-bridge.utils.js";
import { wrapStartChannelsWithDevPluginHotReload } from "@go-usb-ai-service/shared/services/plugin/utils/plugin-dev-hot-reload.utils.js";
import { ServiceMarketplaceInstaller } from "@go-usb-ai-service/shared/services/marketplace/service-marketplace-installer.service.js";
import { NpmRuntimeUpdateHost } from "@go-usb-ai-service/shared/services/ui/npm-runtime-update-host.service.js";
import { createRuntimeControlHost } from "@go-usb-ai-service/shared/services/ui/runtime-control-host.service.js";
import { localUiRuntimeStore } from "@go-usb-ai-service/shared/stores/local-ui-runtime.store.js";
import { managedServiceStateStore } from "@go-usb-ai-service/shared/stores/managed-service-state.store.js";
import type { RequestRestartParams } from "@go-usb-ai-service/shared/types/cli.types.js";
import { openBrowser, resolveUiConfig, resolveUiStaticDir } from "@go-usb-ai-service/shared/utils/cli.utils.js";
import { logStartupTrace, measureStartupAsync, measureStartupSync } from "@go-usb-ai-service/shared/utils/startup-trace.js";

const {
  getConfigPath,
  getDataDir,
  getWorkspacePath,
} = GoUsbAiCore;

const DEV_PLUGIN_HOT_RELOAD_STARTUP_SETTLE_MS = 5_000;

function resolveApplyRestartMode(uiPort: number): "managed-service-restart" | "manual-process-restart" {
  const serviceState = managedServiceStateStore.read();
  if (serviceState?.pid === process.pid) {
    return "managed-service-restart";
  }
  if (
    process.env.GOUSB_AI_RUNTIME_BUNDLE_CHILD === "1" &&
    typeof serviceState?.uiPort === "number" &&
    serviceState.uiPort === uiPort
  ) {
    return "managed-service-restart";
  }
  return "manual-process-restart";
}

type Config = GoUsbAiCore.Config;
type MessageBus = GoUsbAiCore.MessageBus;
type SessionManager = GoUsbAiCore.SessionManager;

type GatewayRuntimeOptions = {
  uiOverrides?: Partial<Config["ui"]>;
  uiStaticDir?: string | null;
};

export type GatewayRuntimeDeps = {
  requestRestart: (params: RequestRestartParams) => Promise<void>;
  initializeAgentHomeDirectory: (homeDirectory: string) => void;
  startService: (options: { uiOverrides: Record<string, unknown>; open: boolean }) => Promise<void>;
  stopService: () => Promise<void>;
  runCliSubcommand: (args: string[]) => Promise<string>;
  installBuiltinMarketplaceSkill: (slug: string, force: boolean | undefined) => { message: string; output?: string } | null;
};

export class GoUsbAiGatewayRuntime {
  readonly kernel: GoUsbAiKernel;
  readonly appEventBus: EventBus;
  readonly messageBus: MessageBus;
  readonly sessionManager: SessionManager;
  readonly automation: AutomationManager;
  readonly runtimeControl: UiRuntimeControlHost;
  readonly runtimeUpdate: UiRuntimeUpdateHost | null;
  readonly ingress: Ingress;
  readonly distribution = GoUsbAiDistributionService.get();
  readonly productVersion: string;
  readonly providerManager: LlmProviderManager;
  readonly gatewayController: GatewayControllerImpl;

  readonly configManager: ConfigManager;
  readonly uiConfig: Config["ui"];
  readonly uiStaticDir: string | null;
  readonly workspace: string;
  readonly remoteManager: GatewayRemoteManager;
  readonly marketplace: MarketplaceApiConfig;
  readonly plugins: GatewayPluginManager;
  readonly restartWake: GatewayRestartWakeService;
  bootstrapStatus: ServiceBootstrapStatusStore;
  uiStartup: UiStartupHandle;
  readonly fileWatchers = new ServiceFileWatcherRegistry();
  private deferredChannelStarter: () => Promise<void>;

  constructor(
    private readonly deps: GatewayRuntimeDeps,
    private readonly options: GatewayRuntimeOptions,
  ) {
    const configPath = getConfigPath();
    this.kernel = measureStartupSync(
      "service.gateway.kernel",
      () => new GoUsbAiKernel({
        homeDir: getDataDir(),
        configPath,
      }),
    );
    this.configManager = this.kernel.configManager;
    const config = this.configManager.config;
    this.uiConfig = resolveUiConfig(config, options.uiOverrides);
    this.uiStaticDir = options.uiStaticDir === undefined ? resolveUiStaticDir(this.distribution.uiDistDir) : options.uiStaticDir;
    this.workspace = getWorkspacePath(config.agents.defaults.workspace);
    this.appEventBus = this.kernel.eventBus;
    this.ingress = this.kernel.ingress;
    this.messageBus = this.kernel.messageBus;
    this.sessionManager = this.kernel.sessions;
    this.automation = this.kernel.automation;
    this.productVersion = this.distribution.version;
    this.plugins = new GatewayPluginManager(this);
    this.providerManager = this.kernel.llmProviders;
    this.installConfigHostHooks();
    this.restartWake = new GatewayRestartWakeService(this);
    this.bootstrapStatus = this.createBootstrapStatus();
    this.uiStartup = this.createDisabledUiStartup();
    this.remoteManager = new GatewayRemoteManager({
      deps: this.deps,
      configManager: this.configManager,
      uiConfig: this.uiConfig,
      onRemoteStateChange: (state) => this.bootstrapStatus.syncRemoteRuntimeState(state),
    });
    this.marketplace = this.createMarketplace();
    this.runtimeControl = createRuntimeControlHost({
      serviceCommands: this.deps,
      requestRestart: this.deps.requestRestart,
      uiConfig: this.uiConfig,
    });
    this.runtimeUpdate =
      process.env.GOUSB_AI_DISABLE_RUNTIME_UPDATE_HOST === "1"
        ? null
        : new NpmRuntimeUpdateHost({
            eventBus: this.appEventBus,
            applyRestartMode: resolveApplyRestartMode(this.uiConfig.port),
            requestRestart: this.deps.requestRestart,
            uiConfig: this.uiConfig,
    });
    this.gatewayController = this.createGatewayController();
    this.kernel.provideGatewayController(this.gatewayController);
    this.deferredChannelStarter = this.startChannels;
    this.automation.onJob = createCronJobHandler({
      agentRunRequests: this.kernel.agentRunRequestManager,
      bus: this.messageBus,
    });
  }

  start = async (): Promise<void> => {
    logStartupTrace("service.start_gateway.begin");
    await this.reset();
    this.configureIngressHandlers();
    this.uiStartup = await this.startUiRuntime();
    await companionRuntimeService.applyConfig(this.configManager.config);
    await this.markUiRuntimeReady();
    await this.startSupportServices();
    this.installChannelDevHotReload();
    await this.runRuntimeLoop();
    await companionRuntimeService.ensureStopped();
    logStartupTrace("service.start_gateway.end");
  };

  private reset = async (): Promise<void> => {
    await this.fileWatchers.clear();
    this.bootstrapStatus = this.createBootstrapStatus();
    this.uiStartup = this.createDisabledUiStartup();
    this.deferredChannelStarter = this.startChannels;
  };

  private createBootstrapStatus = (): ServiceBootstrapStatusStore => {
    const bootstrapStatus = new ServiceBootstrapStatusStore();
    bootstrapStatus.markChannelsPending();
    bootstrapStatus.setRemoteState(this.configManager.config.remote.enabled ? "pending" : "disabled");
    return bootstrapStatus;
  };

  private createDisabledUiStartup = (): UiStartupHandle => ({
    endpoint: "",
  });

  private startUiRuntime = async (): Promise<UiStartupHandle> => {
    const uiStartup = await measureStartupAsync("service.start_ui_runtime", async () => {
      logStartupTrace("service.start_ui_runtime.begin");
      if (!this.uiConfig.enabled) {
        return this.createDisabledUiStartup();
      }
      const uiServer = await startUiServer(this.createUiRouterOptions());
      const uiUrl = GoUsbAiCore.resolveLocalUiBaseUrl({
        host: uiServer.host,
        port: uiServer.port,
      });
      console.log(`✓ UI API: ${uiUrl}/api`);
      if (this.uiStaticDir) {
        console.log(`✓ UI frontend: ${uiUrl}`);
      }
      if (this.uiConfig.open) {
        openBrowser(uiUrl);
      }
      logStartupTrace("service.start_ui_runtime.ready", {
        host: uiServer.host,
        port: uiServer.port,
      });
      return {
        endpoint: uiUrl,
      };
    });
    markLocalUiRuntimeIfStarted({
      uiStartup: this.uiConfig.enabled ? uiStartup : null,
      uiConfig: this.uiConfig,
    });
    return uiStartup;
  };

  private createUiRouterOptions = (): UiRouterOptions => ({
    kernel: this.kernel,
    configPath: this.configManager.configPath,
    appEventBus: this.appEventBus,
    uiConfig: this.uiConfig,
    uiStaticDir: this.uiStaticDir,
    productVersion: this.productVersion,
    applyLiveConfigReload: this.configManager.applyLiveConfigReload,
    initializeAgentHomeDirectory: this.deps.initializeAgentHomeDirectory,
    marketplace: this.marketplace,
    cron: this.automation,
    remoteAccess: this.remoteManager.remoteAccess,
    runtimeControl: this.runtimeControl,
    ...(this.runtimeUpdate ? { runtimeUpdate: this.runtimeUpdate } : {}),
    bootstrapStatus: this.bootstrapStatus,
    plugins: this.plugins,
  });

  private runRuntimeLoop = async (): Promise<void> => {
    logStartupTrace("service.start_gateway.runtime_loop_begin");
    let startupTask: Promise<void> | null = null;
    try {
      const runtimeLoopTask = runGatewayInboundLoop(this);
      startupTask = this.startDeferredRuntime();
      void startupTask.catch((error) => handleGatewayDeferredStartupError({
        bootstrapStatus: this.bootstrapStatus,
        error,
      }));
      await runtimeLoopTask;
    } finally {
      if (startupTask) {
        await startupTask.catch(() => undefined);
      }
      await this.cleanup();
    }
  };

  private startDeferredRuntime = async (): Promise<void> => {
    const app = new GoUsbAiApp(this);
    await app.start();
  };

  readonly startDeferredChannels = async (): Promise<void> => {
    await this.deferredChannelStarter();
  };

  private installChannelDevHotReload = (): void => {
    this.deferredChannelStarter = wrapStartChannelsWithDevPluginHotReload({
      startChannels: this.startChannels,
      watcherRegistry: this.fileWatchers,
      isRuntimeActive: () => true,
      reloadPlugins: async (pluginIds: string[]) => {
        await this.plugins.reloadForDevHotReload(
          pluginIds.map((pluginId) => `plugins.entries.${pluginId}.source`),
        );
      },
      startupSettleMs: DEV_PLUGIN_HOT_RELOAD_STARTUP_SETTLE_MS,
    });
  };

  private readonly startChannels = async (): Promise<void> => {
    await this.kernel.channels.start();
    const enabledChannels = this.kernel.channels.enabledChannels;
    if (enabledChannels.length > 0) {
      console.log(`✓ Channels enabled: ${enabledChannels.join(", ")}`);
    } else {
      console.log("Warning: No channels enabled");
    }
    this.bootstrapStatus.markChannelsReady(enabledChannels);
  };

  private createMarketplace = (): MarketplaceApiConfig => ({
    apiBaseUrl: process.env.GOUSB_AI_MARKETPLACE_API_BASE,
    installer: new ServiceMarketplaceInstaller({
      applyLiveConfigReload: this.configManager.applyLiveConfigReload,
      runCliSubcommand: this.deps.runCliSubcommand,
      installBuiltinSkill: this.deps.installBuiltinMarketplaceSkill,
    }).createInstaller(),
  });

  private cleanup = async (): Promise<void> => {
    localUiRuntimeStore.clearIfOwnedByProcess();
    await this.fileWatchers.clear();
    await this.kernel.extensions.stop();
    await this.remoteManager.stop();
    await this.plugins.stopGateways();
    setPluginRuntimeBridge(null);
  };

  private markUiRuntimeReady = async (): Promise<void> => {
    this.bootstrapStatus.markShellReady();
    await waitForNextTick();
  };

  private createGatewayController = (): GatewayControllerImpl => {
    return measureStartupSync(
      "service.gateway.gateway_controller",
      () => new GatewayControllerImpl({
        configManager: this.configManager,
        channels: this.kernel.channels,
        cron: this.automation,
        sessionManager: this.sessionManager,
        requestRestart: async (options) => {
          await this.deps.requestRestart({
            reason: options?.reason ?? "gateway tool restart",
            manualMessage: "Restart the gateway to apply changes.",
            strategy: "background-service-or-exit",
            delayMs: options?.delayMs,
            silentOnServiceRestart: true,
          });
        },
      })
    );
  };

  private startSupportServices = async (): Promise<void> => {
    this.plugins.publishConfigChanges();
    this.configurePluginRuntime();
    await measureStartupAsync("service.start_gateway_support_services", async () =>
      await startGatewayRuntimeSupport({
        automation: this.automation,
        remoteModule: this.remoteManager.remoteModule,
        watchConfigFile: () => watchServiceConfigFile({
          configPath: resolve(getConfigPath()),
          watcherRegistry: this.fileWatchers,
          scheduleReload: (reason) => this.configManager.scheduleReload(reason)
        }),
        watcherRegistry: this.fileWatchers
      })
    );
  };

  private configurePluginRuntime = (): void => {
    installPluginRuntimeBridge(this);
  };

  private installConfigHostHooks = (): void => {
    this.configManager.installRuntimeHooks({
      reloadCompanion: async ({ config: nextConfig }) => {
        await companionRuntimeService.applyConfig(nextConfig);
      },
      reloadPlugins: async ({ config: nextConfig, changedPaths }) => {
        const result = await this.plugins.reloadForConfigChange({
          config: nextConfig,
          changedPaths,
        });
        if (result.restartChannels) {
          console.log("Config reload: plugin channel gateways restarted.");
        }
        return { restartChannels: result.restartChannels };
      },
      onRestartRequired: (paths) => {
        void this.deps.requestRestart({
          changedPaths: paths,
          manualMessage: `已保存以下改动，等待你手动重启后生效：${paths.join(", ")}`,
          mode: "notify",
          reason: `config reload requires restart: ${paths.join(", ")}`,
          strategy: "background-service-or-manual",
        });
      },
    });
  };

  private configureIngressHandlers = (): void => {
    this.kernel.extensions.registerIngressHandlers();
  };

}
