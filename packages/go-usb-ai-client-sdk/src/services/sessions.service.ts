import type {
  NcpSessionSkillsView,
  SessionPatchUpdate,
  UiNcpAssetPutView,
  UiNcpSessionListView,
  UiNcpSessionMessagesView
} from "@go-usb-ai/server";
import type { EventBus } from "@go-usb-ai/shared";
import type { NcpSessionSummary } from "@go-usb-ai/ncp";
import type { GoUsbAiRealtimeHandler, GoUsbAiRealtimeSubscribeOptions } from "../types/go-usb-ai-request.types.js";
import type { GoUsbAiRealtimeSubscription } from "../types/go-usb-ai-realtime.types.js";
import type { RequestService } from "./request.service.js";

export class SessionsService {
  constructor(
    private readonly requestService: RequestService,
    private readonly eventBus: EventBus
  ) {}

  readonly list = async (params?: { limit?: number }): Promise<UiNcpSessionListView> => {
    const query = new URLSearchParams();
    if (typeof params?.limit === "number" && Number.isFinite(params.limit)) {
      query.set("limit", String(Math.max(1, Math.trunc(params.limit))));
    }
    return await this.requestService.get<UiNcpSessionListView>("/api/ncp/sessions", {
      ...(query.size > 0 ? { query } : {})
    });
  };

  readonly get = async (sessionId: string): Promise<NcpSessionSummary> => {
    return await this.requestService.get<NcpSessionSummary>(
      `/api/ncp/sessions/${encodeURIComponent(sessionId)}`
    );
  };

  readonly listMessages = async (sessionId: string, limit = 200): Promise<UiNcpSessionMessagesView> => {
    return await this.requestService.get<UiNcpSessionMessagesView>(
      `/api/ncp/sessions/${encodeURIComponent(sessionId)}/messages`,
      {
        query: { limit: Math.max(1, Math.trunc(limit)) }
      }
    );
  };

  readonly listSkills = async (
    sessionId: string,
    params?: { projectRoot?: string | null }
  ): Promise<NcpSessionSkillsView> => {
    return await this.requestService.get<NcpSessionSkillsView>(
      `/api/ncp/sessions/${encodeURIComponent(sessionId)}/skills`,
      {
        query: params?.projectRoot?.trim() ? { projectRoot: params.projectRoot.trim() } : undefined
      }
    );
  };

  readonly update = async (sessionId: string, patch: SessionPatchUpdate): Promise<NcpSessionSummary> => {
    return await this.requestService.put<NcpSessionSummary>(
      `/api/ncp/sessions/${encodeURIComponent(sessionId)}`,
      patch
    );
  };

  readonly delete = async (sessionId: string): Promise<{ deleted: boolean; sessionId: string }> => {
    return await this.requestService.delete<{ deleted: boolean; sessionId: string }>(
      `/api/ncp/sessions/${encodeURIComponent(sessionId)}`
    );
  };

  readonly uploadAssets = async (files: readonly File[]): Promise<UiNcpAssetPutView> => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    return await this.requestService.upload<UiNcpAssetPutView>("/api/ncp/assets", formData);
  };

  readonly subscribe = (
    handler: GoUsbAiRealtimeHandler,
    _options: GoUsbAiRealtimeSubscribeOptions = {}
  ): GoUsbAiRealtimeSubscription => {
    const unsubscribe = this.eventBus.subscribeAll((event) => {
      handler(event);
    });
    return {
      close: unsubscribe
    };
  };
}
