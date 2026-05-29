import { CronService } from "@go-usb-ai/core";

export type AutomationManagerOptions = {
  storePath: string;
};

export class AutomationManager extends CronService {
  constructor(options: AutomationManagerOptions) {
    super(options.storePath);
  }
}
