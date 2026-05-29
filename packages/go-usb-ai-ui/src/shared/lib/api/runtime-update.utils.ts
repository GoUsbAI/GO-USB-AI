import type { UpdatePreferences, UpdateSnapshot } from '@go-usb-ai/shared';
import { goUsbAiClient } from './managers/client.manager';

export async function fetchRuntimeUpdate(): Promise<UpdateSnapshot> {
  return await goUsbAiClient.runtimeUpdate.fetch();
}

export async function checkRuntimeUpdate(): Promise<UpdateSnapshot> {
  return await goUsbAiClient.runtimeUpdate.check();
}

export async function downloadRuntimeUpdate(): Promise<UpdateSnapshot> {
  return await goUsbAiClient.runtimeUpdate.download();
}

export async function applyRuntimeUpdate(): Promise<UpdateSnapshot> {
  return await goUsbAiClient.runtimeUpdate.apply();
}

export async function updateRuntimeUpdatePreferences(preferences: Partial<UpdatePreferences>): Promise<UpdateSnapshot> {
  return await goUsbAiClient.runtimeUpdate.updatePreferences(preferences);
}

export async function updateRuntimeUpdateChannel(channel: UpdateSnapshot['channel']): Promise<UpdateSnapshot> {
  return await goUsbAiClient.runtimeUpdate.updateChannel(channel);
}
