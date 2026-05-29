import type * as GoUsbAiCore from "@go-usb-ai/core";
import type { EventBus, Ingress } from "@go-usb-ai/shared";
import type { ChildProcess } from "node:child_process";
import type {
  PluginChannelBinding,
  PluginUiMetadata,
} from "@go-usb-ai/openclaw-compat";

export type Config = GoUsbAiCore.Config;
export type InboundAttachment = GoUsbAiCore.InboundAttachment;
export type InboundMessage = GoUsbAiCore.InboundMessage;
export type MessageBus = GoUsbAiCore.MessageBus;
export type SessionManager = GoUsbAiCore.SessionManager;

export type ExtensionServerConfig = {
  type: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
};

export type ExtensionManifest = {
  id: string;
  name?: string;
  version?: string;
  rootDir: string;
  server: ExtensionServerConfig;
  contributes?: {
    channels?: Array<{
      id: string;
      name?: string;
      description?: string;
      meta?: Record<string, unknown>;
      configSchema?: Record<string, unknown>;
      configUiHints?: Record<string, Record<string, unknown>>;
      auth?: boolean | Record<string, unknown>;
      outbound?: {
        text?: boolean;
      };
    }>;
  };
};

export type ExtensionRuntimeContributions = {
  channelBindings: PluginChannelBinding[];
  uiMetadata: PluginUiMetadata[];
};

export type RunningExtensionProcess = {
  manifest: ExtensionManifest;
  process: ChildProcess;
};

export type PendingExtensionRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

export type ExtensionChannelRequestKind =
  | "channel.auth.login"
  | "channel.auth.start"
  | "channel.auth.poll"
  | "channel.outbound.sendText";

export type ExtensionRequestSender = <T>(params: {
  extensionId: string;
  kind: ExtensionChannelRequestKind;
  payload: Record<string, unknown>;
}) => Promise<T>;

export type ExtensionRuntimeServiceOptions = {
  eventBus: Pick<EventBus, "emitEnvelope">;
  getConfig: () => Config;
  getWorkspace: () => string;
  ingress: Pick<Ingress, "addHandler">;
  messageBus: Pick<MessageBus, "publishInbound">;
  sessionManager: SessionManager;
};
