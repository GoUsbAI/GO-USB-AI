import { parseStartTimeoutMs, resolveManagedServiceUiOverrides } from "@go-usb-ai-service/shared/utils/runtime-helpers.js";
import type { StartCommandOptions } from "@go-usb-ai-service/shared/types/cli.types.js";
import type { RuntimeCommandService } from "@go-usb-ai-service/shared/services/runtime/runtime-command.service.js";

export class StartCommands {
  constructor(
    private readonly deps: {
      runtimeCommandService: RuntimeCommandService;
      forcedPublicHost: string;
      init: (params: { source: string; auto: boolean }) => Promise<void>;
    }
  ) {}

  run = async (opts: StartCommandOptions): Promise<void> => {
    const startupTimeoutMs = parseStartTimeoutMs(opts.startTimeout);
    await this.deps.init({ source: "start", auto: true });
    const uiOverrides = resolveManagedServiceUiOverrides({
      uiPort: opts.uiPort,
      forcedPublicHost: this.deps.forcedPublicHost
    });

    await this.deps.runtimeCommandService.startService({
      uiOverrides,
      open: Boolean(opts.open),
      startupTimeoutMs,
    });
  };
}
