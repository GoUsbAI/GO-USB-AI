import { goUsbAiClient } from '@/shared/lib/api/managers/client.manager';
import type {
  MarketplaceInstallRequest,
  MarketplaceInstallResult,
  MarketplaceManageRequest,
  MarketplaceManageResult,
  MarketplaceInstalledView,
  MarketplacePluginContentView,
  MarketplaceItemType,
  MarketplaceSkillContentView,
  MarketplaceItemView,
  MarketplaceListView,
  MarketplaceRecommendationView,
  MarketplaceScenesView,
  MarketplaceSort
} from '@/shared/lib/api/types';

export type MarketplaceListParams = {
  type: MarketplaceItemType;
  q?: string;
  tag?: string;
  scene?: string;
  sort?: MarketplaceSort;
  page?: number;
  pageSize?: number;
};

export async function fetchMarketplaceItems(params: MarketplaceListParams): Promise<MarketplaceListView> {
  return await goUsbAiClient.marketplace.fetchItems(params);
}

export async function fetchMarketplaceItem(slug: string, type: MarketplaceItemType): Promise<MarketplaceItemView> {
  return await goUsbAiClient.marketplace.fetchItem(slug, type);
}

export async function fetchMarketplaceSkillContent(slug: string): Promise<MarketplaceSkillContentView> {
  return await goUsbAiClient.marketplace.fetchSkillContent(slug);
}

export async function fetchMarketplacePluginContent(slug: string): Promise<MarketplacePluginContentView> {
  return await goUsbAiClient.marketplace.fetchPluginContent(slug);
}

export async function fetchMarketplaceRecommendations(
  type: MarketplaceItemType,
  params: {
    scene?: string;
    limit?: number;
  } = {}
): Promise<MarketplaceRecommendationView> {
  return await goUsbAiClient.marketplace.fetchRecommendations(type, params);
}

export async function fetchMarketplaceSkillScenes(): Promise<MarketplaceScenesView> {
  return await goUsbAiClient.marketplace.fetchSkillScenes();
}

export async function installMarketplaceItem(request: MarketplaceInstallRequest): Promise<MarketplaceInstallResult> {
  return await goUsbAiClient.marketplace.install(
    request as Parameters<typeof goUsbAiClient.marketplace.install>[0]
  ) as MarketplaceInstallResult;
}

export async function fetchMarketplaceInstalled(type: MarketplaceItemType): Promise<MarketplaceInstalledView> {
  return await goUsbAiClient.marketplace.fetchInstalled(type);
}

export async function manageMarketplaceItem(request: MarketplaceManageRequest): Promise<MarketplaceManageResult> {
  return await goUsbAiClient.marketplace.manage(
    request as Parameters<typeof goUsbAiClient.marketplace.manage>[0]
  ) as MarketplaceManageResult;
}
