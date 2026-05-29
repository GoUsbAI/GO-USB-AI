import type { NcpDraftAttachment } from "@go-usb-ai/ncp-react";
import { goUsbAiClient } from "../managers/client.manager";

export async function uploadNcpAssets(files: File[]): Promise<NcpDraftAttachment[]> {
  const payload = await goUsbAiClient.sessions.uploadAssets(files);
  return payload.assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    assetUri: asset.assetUri,
    url: asset.url,
  }));
}
