import { resolveManagedServiceUiOverrides } from "@go-usb-ai-service/shared/utils/runtime-helpers.js";
import type { RuntimeCommandService } from "@go-usb-ai-service/shared/services/runtime/runtime-command.service.js";
import type { StartCommandOptions } from "@go-usb-ai-service/shared/types/cli.types.js";

export class ServeCommands {
  constructor(
    private readonly deps: {
      runtimeCommandService: RuntimeCommandService;
      forcedPublicHost: string;
    }
  ) {}

  run = async (opts: StartCommandOptions): Promise<void> => {
    const uiOverrides = resolveManagedServiceUiOverrides({
      uiPort: opts.uiPort,
      forcedPublicHost: this.deps.forcedPublicHost
    });

    await this.deps.runtimeCommandService.runForeground({
      uiOverrides,
      open: Boolean(opts.open),
    });
  };
}
