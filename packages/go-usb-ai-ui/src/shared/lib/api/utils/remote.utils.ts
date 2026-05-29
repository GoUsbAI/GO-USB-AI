import { goUsbAiClient } from '../managers/client.manager';
import type {
  RemoteAccessView,
  RemoteAccountProfileUpdateRequest,
  RemoteBrowserAuthPollRequest,
  RemoteBrowserAuthPollResult,
  RemoteBrowserAuthStartRequest,
  RemoteBrowserAuthStartResult,
  RemoteDoctorView,
  RemoteLoginRequest,
  RemoteServiceAction,
  RemoteServiceActionResult,
  RemoteSettingsUpdateRequest
} from '@/shared/lib/api/remote.types';

export async function fetchRemoteStatus(): Promise<RemoteAccessView> {
  return await goUsbAiClient.remote.fetchStatus();
}

export async function fetchRemoteDoctor(): Promise<RemoteDoctorView> {
  return await goUsbAiClient.remote.fetchDoctor();
}

export async function loginRemote(data: RemoteLoginRequest): Promise<RemoteAccessView> {
  return await goUsbAiClient.remote.login(data);
}

export async function startRemoteBrowserAuth(data: RemoteBrowserAuthStartRequest): Promise<RemoteBrowserAuthStartResult> {
  return await goUsbAiClient.remote.startBrowserAuth(data);
}

export async function pollRemoteBrowserAuth(data: RemoteBrowserAuthPollRequest): Promise<RemoteBrowserAuthPollResult> {
  return await goUsbAiClient.remote.pollBrowserAuth(data);
}

export async function logoutRemote(): Promise<RemoteAccessView> {
  return await goUsbAiClient.remote.logout();
}

export async function updateRemoteAccountProfile(data: RemoteAccountProfileUpdateRequest): Promise<RemoteAccessView> {
  return await goUsbAiClient.remote.updateAccountProfile(data);
}

export async function updateRemoteSettings(data: RemoteSettingsUpdateRequest): Promise<RemoteAccessView> {
  return await goUsbAiClient.remote.updateSettings(data);
}

export async function controlRemoteService(action: RemoteServiceAction): Promise<RemoteServiceActionResult> {
  return await goUsbAiClient.remote.controlService(action);
}
