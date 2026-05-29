import type { GoUsbAiDistribution } from "@go-usb-ai-service/shared/types/distribution.types.js";

export class GoUsbAiDistributionService {
  private static currentDistribution: GoUsbAiDistribution | null = null;

  static configure(distribution: GoUsbAiDistribution): void {
    GoUsbAiDistributionService.currentDistribution = distribution;
  }

  static get(): GoUsbAiDistribution {
    if (!GoUsbAiDistributionService.currentDistribution) {
      throw new Error("GoUsbAi distribution is not configured.");
    }
    return GoUsbAiDistributionService.currentDistribution;
  }
}
