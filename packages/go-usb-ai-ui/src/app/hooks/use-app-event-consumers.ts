import { useEffect, useRef } from 'react';
import { eventKeys } from '@go-usb-ai/shared';
import { applyNcpSessionRealtimeEvent, goUsbAiClient } from '@/shared/lib/api';
import { runtimeUpdateManager, systemStatusManager } from '@/features/system-status';
import type { QueryClient } from '@tanstack/react-query';

function shouldInvalidateConfigQuery(configPath: string) {
  const normalized = configPath.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  if (normalized.startsWith('plugins') || normalized.startsWith('skills')) {
    return false;
  }
  return true;
}

function invalidateMarketplaceQueries(queryClient: QueryClient | undefined, configPath: string): void {
  if (configPath.startsWith('plugins')) {
    queryClient?.invalidateQueries({ queryKey: ['ncp-session-types'] });
    queryClient?.invalidateQueries({ queryKey: ['marketplace-installed', 'plugin'] });
    queryClient?.invalidateQueries({ queryKey: ['marketplace-items'] });
  }
  if (configPath.startsWith('mcp')) {
    queryClient?.invalidateQueries({ queryKey: ['marketplace-mcp-installed'] });
    queryClient?.invalidateQueries({ queryKey: ['marketplace-mcp-items'] });
    queryClient?.invalidateQueries({ queryKey: ['marketplace-mcp-doctor'] });
  }
}

function handleConfigUpdatedEvent(queryClient: QueryClient | undefined, path: string): void {
  if (queryClient && shouldInvalidateConfigQuery(path)) {
    queryClient.invalidateQueries({ queryKey: ['config'] });
  }
  invalidateMarketplaceQueries(queryClient, path);
}

export function useAppEventConsumers(queryClient?: QueryClient) {
  const shouldResyncSessionsRef = useRef(false);

  useEffect(() => {
    const unsubscribeConnectionOpen = goUsbAiClient.eventBus.on(eventKeys.connectionOpen, () => {
      systemStatusManager.handleConnectionRestored();
      void runtimeUpdateManager.refreshAfterRealtimeReconnect();
      if (shouldResyncSessionsRef.current) {
        shouldResyncSessionsRef.current = false;
        queryClient?.invalidateQueries({ queryKey: ['ncp-sessions'] });
      }
    });
    const unsubscribeConnectionClose = goUsbAiClient.eventBus.on(eventKeys.connectionClose, () => {
      systemStatusManager.handleConnectionInterrupted(null);
      shouldResyncSessionsRef.current = true;
    });
    const unsubscribeConnectionError = goUsbAiClient.eventBus.on(eventKeys.connectionError, (payload) => {
      systemStatusManager.handleConnectionInterrupted(payload?.message ?? null);
      shouldResyncSessionsRef.current = true;
    });
    const unsubscribeConfigUpdated = goUsbAiClient.eventBus.on(eventKeys.configUpdated, ({ path }) => {
      handleConfigUpdatedEvent(queryClient, path);
    });
    const unsubscribeRuntimeUpdate = goUsbAiClient.eventBus.on(eventKeys.runtimeUpdateSnapshot, (snapshot) => {
      runtimeUpdateManager.reportSnapshot(snapshot);
    });
    const unsubscribeSessionRunStatus = goUsbAiClient.eventBus.on(eventKeys.sessionRunStatus, (payload) => {
      applyNcpSessionRealtimeEvent(queryClient, { type: 'session.run-status', payload });
    });
    const unsubscribeSessionSummaryUpsert = goUsbAiClient.eventBus.on(eventKeys.sessionSummaryUpsert, (payload) => {
      applyNcpSessionRealtimeEvent(queryClient, { type: 'session.summary.upsert', payload });
    });
    const unsubscribeSessionSummaryDelete = goUsbAiClient.eventBus.on(eventKeys.sessionSummaryDelete, (payload) => {
      applyNcpSessionRealtimeEvent(queryClient, { type: 'session.summary.delete', payload });
    });
    const unsubscribeError = goUsbAiClient.eventBus.on(eventKeys.error, (payload) => {
      console.error('Realtime transport error:', payload.message);
    });

    return () => {
      unsubscribeConnectionOpen();
      unsubscribeConnectionClose();
      unsubscribeConnectionError();
      unsubscribeConfigUpdated();
      unsubscribeRuntimeUpdate();
      unsubscribeSessionRunStatus();
      unsubscribeSessionSummaryUpsert();
      unsubscribeSessionSummaryDelete();
      unsubscribeError();
    };
  }, [queryClient]);
}
