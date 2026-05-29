import { GoUsbAiDistributionService, runGoUsbAiNpmRuntimeLauncher } from "@go-usb-ai/service";
import { createGoUsbAiDistribution } from "@go-usb-ai-cli/cli/shared/lib/distribution/index.js";

GoUsbAiDistributionService.configure(createGoUsbAiDistribution(import.meta.url));
runGoUsbAiNpmRuntimeLauncher(process.argv);
