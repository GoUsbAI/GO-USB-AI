import { goUsbAiClient } from '@/shared/lib/api/managers/client.manager';
import type {
  AuthEnabledUpdateRequest,
  AuthLoginRequest,
  AuthPasswordUpdateRequest,
  AuthSetupRequest,
  AuthStatusView,
  AppMetaView,
  BootstrapStatusView,
  ConfigView,
  ConfigMetaView,
  ConfigSchemaResponse,
  ProviderConfigView,
  ChannelConfigUpdate,
  ProviderConfigUpdate,
  ProviderConnectionTestRequest,
  ProviderConnectionTestResult,
  ProviderAuthStartRequest,
  ProviderAuthStartResult,
  ProviderAuthPollRequest,
  ProviderAuthPollResult,
  ProviderAuthImportResult,
  SearchConfigUpdate,
  SearchConfigView,
  ProviderCreateRequest,
  ProviderCreateResult,
  ProviderDeleteResult,
  RuntimeConfigUpdate,
  SecretsConfigUpdate,
  SecretsView,
  ConfigActionExecuteRequest,
  ConfigActionExecuteResult,
  ChatSessionTypesView,
  CronListView,
  CronEnableRequest,
  CronRunRequest,
  CronActionResult
} from '@/shared/lib/api/types';

export async function fetchAuthStatus(options: { timeoutMs?: number } = {}): Promise<AuthStatusView> {
  return await goUsbAiClient.auth.fetchStatus({
    timeoutMs: options.timeoutMs ?? 5_000,
  });
}

export async function setupAuth(data: AuthSetupRequest): Promise<AuthStatusView> {
  return await goUsbAiClient.auth.setup(data);
}

export async function loginAuth(data: AuthLoginRequest): Promise<AuthStatusView> {
  return await goUsbAiClient.auth.login(data);
}

export async function logoutAuth(): Promise<{ success: boolean }> {
  return await goUsbAiClient.auth.logout();
}

export async function updateAuthPassword(data: AuthPasswordUpdateRequest): Promise<AuthStatusView> {
  return await goUsbAiClient.auth.updatePassword(data);
}

export async function updateAuthEnabled(data: AuthEnabledUpdateRequest): Promise<AuthStatusView> {
  return await goUsbAiClient.auth.updateEnabled(data);
}

export async function fetchAppMeta(): Promise<AppMetaView> {
  return await goUsbAiClient.app.fetchMeta();
}

export async function fetchBootstrapStatus(options: { timeoutMs?: number } = {}): Promise<BootstrapStatusView> {
  return await goUsbAiClient.app.fetchBootstrapStatus(options);
}

export async function fetchConfig(): Promise<ConfigView> {
  return await goUsbAiClient.config.fetch();
}

export async function fetchConfigMeta(): Promise<ConfigMetaView> {
  return await goUsbAiClient.config.fetchMeta();
}

export async function fetchConfigSchema(): Promise<ConfigSchemaResponse> {
  return await goUsbAiClient.config.fetchSchema();
}

export async function updateModel(data: { model: string; workspace?: string }): Promise<{ model: string; workspace?: string }> {
  return await goUsbAiClient.config.updateModel(data);
}

export async function updateSearch(data: SearchConfigUpdate): Promise<SearchConfigView> {
  return await goUsbAiClient.config.updateSearch(data);
}

export async function updateProvider(provider: string, data: ProviderConfigUpdate): Promise<ProviderConfigView> {
  return await goUsbAiClient.config.updateProvider(provider, data);
}

export async function createProvider(data: ProviderCreateRequest = {}): Promise<ProviderCreateResult> {
  return await goUsbAiClient.config.createProvider(data);
}

export async function deleteProvider(provider: string): Promise<ProviderDeleteResult> {
  return await goUsbAiClient.config.deleteProvider(provider);
}

export async function testProviderConnection(
  provider: string,
  data: ProviderConnectionTestRequest
): Promise<ProviderConnectionTestResult> {
  return await goUsbAiClient.config.testProviderConnection(provider, data);
}

export async function startProviderAuth(
  provider: string,
  data: ProviderAuthStartRequest = {}
): Promise<ProviderAuthStartResult> {
  return await goUsbAiClient.config.startProviderAuth(provider, data);
}

export async function pollProviderAuth(
  provider: string,
  data: ProviderAuthPollRequest
): Promise<ProviderAuthPollResult> {
  return await goUsbAiClient.config.pollProviderAuth(provider, data);
}

export async function importProviderAuthFromCli(provider: string): Promise<ProviderAuthImportResult> {
  return await goUsbAiClient.config.importProviderAuthFromCli(provider);
}

export async function updateChannel(
  channel: string,
  data: ChannelConfigUpdate
): Promise<Record<string, unknown>> {
  return await goUsbAiClient.config.updateChannel(channel, data);
}

export async function updateRuntime(
  data: RuntimeConfigUpdate
): Promise<Pick<ConfigView, 'agents' | 'bindings' | 'session'>> {
  return await goUsbAiClient.config.updateRuntime(data) as Pick<ConfigView, 'agents' | 'bindings' | 'session'>;
}

export async function updateSecrets(data: SecretsConfigUpdate): Promise<SecretsView> {
  return await goUsbAiClient.config.updateSecrets(data);
}

export async function executeConfigAction(
  actionId: string,
  data: ConfigActionExecuteRequest
): Promise<ConfigActionExecuteResult> {
  return await goUsbAiClient.config.executeAction(actionId, data);
}

export async function fetchNcpChatSessionTypes(): Promise<ChatSessionTypesView> {
  return await goUsbAiClient.config.fetchChatSessionTypes();
}

export async function fetchCronJobs(params?: { all?: boolean }): Promise<CronListView> {
  return await goUsbAiClient.config.fetchCronJobs(params);
}

export async function deleteCronJob(id: string): Promise<{ deleted: boolean }> {
  return await goUsbAiClient.config.deleteCronJob(id);
}

export async function setCronJobEnabled(id: string, data: CronEnableRequest): Promise<CronActionResult> {
  return await goUsbAiClient.config.setCronJobEnabled(id, data);
}

export async function runCronJob(id: string, data: CronRunRequest): Promise<CronActionResult> {
  return await goUsbAiClient.config.runCronJob(id, data);
}
