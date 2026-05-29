import type { GoUsbAiKernel } from "@go-usb-ai/kernel";
import { logStartupTrace, measureStartupAsync } from "@go-usb-ai-service/shared/utils/startup-trace.js";
import type { GoUsbAiGatewayRuntime } from "@go-usb-ai-service/shared/services/gateway/go-usb-ai-gateway-runtime.service.js";

export type UiStartupHandle = {
  endpoint: string;
};

type GoUsbAiAppKernel = Pick<
  GoUsbAiKernel,
  "extensions" | "start"
>;

export class GoUsbAiApp {
  private readonly kernel: GoUsbAiAppKernel;

  constructor(private readonly gateway: GoUsbAiGatewayRuntime) {
    this.kernel = gateway.kernel;
  }

  start = async (): Promise<void> => {
    logStartupTrace("service.deferred_startup.begin");
    try {
      await this.bootstrapKernel();
    } catch (error) {
      this.handleKernelStartupError(error);
    }

    await this.startDeferredRuntimeServices();
    console.log("✓ Deferred startup: plugin gateways and channels settled");
    logStartupTrace("service.deferred_startup.end");
  };

  bootstrapKernel = async (): Promise<void> => {
    this.gateway.bootstrapStatus.markNcpAgentRunning();
    await measureStartupAsync(
      "service.deferred_startup.bootstrap_kernel",
      async () => await this.kernel.start(),
    );
    this.gateway.bootstrapStatus.markNcpAgentReady();
    if (this.gateway.uiConfig.enabled) {
      console.log("✓ UI NCP agent: ready");
      return;
    }
    console.log("✓ Service NCP agent: ready");
  };

  startDeferredRuntimeServices = async (): Promise<void> => {
    await measureStartupAsync(
      "service.deferred_startup.load_plugins",
      this.gateway.plugins.load,
    );
    await measureStartupAsync(
      "service.deferred_startup.start_plugin_gateways",
      this.gateway.plugins.startGateways,
    );
    await measureStartupAsync(
      "service.deferred_startup.start_extensions",
      async () => await this.kernel.extensions.start({ endpoint: this.gateway.uiStartup.endpoint }),
    );
    await measureStartupAsync("service.deferred_startup.start_channels", this.gateway.startDeferredChannels);
    await measureStartupAsync(
      "service.deferred_startup.wake_restart_sentinel",
      this.gateway.restartWake.wakeFromRestartSentinel,
    );
  };

  private readonly handleKernelStartupError = (error: unknown): void => {
    this.gateway.bootstrapStatus.markNcpAgentError(
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      `UI NCP agent startup failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  };
}
