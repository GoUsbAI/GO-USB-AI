import type { Config } from "@go-usb-ai/core";
import type { UiCommandOptions } from "@go-usb-ai-service/shared/types/cli.types.js";
import type { RuntimeCommandService } from "@go-usb-ai-service/shared/services/runtime/runtime-command.service.js";

export class UiCommands {
  constructor(
    private readonly deps: {
      runtimeCommandService: RuntimeCommandService;
      forcedPublicHost: string;
    }
  ) {}

  run = async (opts: UiCommandOptions): Promise<void> => {
    const uiOverrides: Partial<Config["ui"]> = {
      enabled: true,
      host: this.deps.forcedPublicHost,
      open: Boolean(opts.open),
    };
    if (opts.port) {
      uiOverrides.port = Number(opts.port);
    }
    await this.deps.runtimeCommandService.startGateway({
      uiOverrides,
    });
  };
}
