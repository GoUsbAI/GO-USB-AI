import type {
  MarketplaceInstalledView,
  MarketplaceInstallRequest,
  MarketplaceInstallResult,
  MarketplaceManageRequest,
  MarketplaceManageResult
} from '@/shared/lib/api';
import {
  applyInstallResultToInstalledView,
  applyManageResultToInstalledView
} from './marketplace-installed-cache.utils';

describe('marketplace-installed-cache', () => {
  it('adds a plugin record immediately after install success', () => {
    const request: MarketplaceInstallRequest = {
      type: 'plugin',
      spec: '@go-usb-ai/community-plugin-slack',
      kind: 'npm'
    };
    const result: MarketplaceInstallResult = {
      type: 'plugin',
      spec: '@go-usb-ai/community-plugin-slack',
      message: 'installed'
    };

    const next = applyInstallResultToInstalledView({ request, result });

    expect(next.total).toBe(1);
    expect(next.specs).toEqual(['@go-usb-ai/community-plugin-slack']);
    expect(next.records[0]).toMatchObject({
      type: 'plugin',
      spec: '@go-usb-ai/community-plugin-slack',
      enabled: true,
      origin: 'marketplace',
      runtimeStatus: 'ready'
    });
  });

  it('marks a plugin record as disabled immediately after disable success', () => {
    const view: MarketplaceInstalledView = {
      type: 'plugin',
      total: 1,
      specs: ['@go-usb-ai/community-plugin-slack'],
      records: [
        {
          type: 'plugin',
          id: '@go-usb-ai/community-plugin-slack',
          spec: '@go-usb-ai/community-plugin-slack',
          label: 'Slack Channel',
          enabled: true,
          origin: 'marketplace'
        }
      ]
    };
    const request: MarketplaceManageRequest = {
      type: 'plugin',
      action: 'disable',
      id: '@go-usb-ai/community-plugin-slack',
      spec: '@go-usb-ai/community-plugin-slack'
    };
    const result: MarketplaceManageResult = {
      type: 'plugin',
      action: 'disable',
      id: '@go-usb-ai/community-plugin-slack',
      message: 'disabled'
    };

    const next = applyManageResultToInstalledView({ view, request, result });

    expect(next.records[0]).toMatchObject({
      enabled: false,
      runtimeStatus: 'disabled'
    });
  });

  it('removes a skill record immediately after uninstall success', () => {
    const view: MarketplaceInstalledView = {
      type: 'skill',
      total: 1,
      specs: ['@go-usb-ai/web-search'],
      records: [
        {
          type: 'skill',
          id: 'web-search',
          spec: '@go-usb-ai/web-search',
          label: 'Web Search',
          source: 'workspace'
        }
      ]
    };
    const request: MarketplaceManageRequest = {
      type: 'skill',
      action: 'uninstall',
      id: 'web-search',
      spec: '@go-usb-ai/web-search'
    };
    const result: MarketplaceManageResult = {
      type: 'skill',
      action: 'uninstall',
      id: 'web-search',
      message: 'removed'
    };

    const next = applyManageResultToInstalledView({ view, request, result });

    expect(next.total).toBe(0);
    expect(next.records).toEqual([]);
    expect(next.specs).toEqual([]);
  });
});
