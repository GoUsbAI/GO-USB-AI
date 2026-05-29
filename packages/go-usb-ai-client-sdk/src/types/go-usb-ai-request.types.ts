import type { GoUsbAiRealtimeEvent, GoUsbAiWebSocketLike } from "./go-usb-ai-realtime.types.js";
import type {
  GoUsbAiQueryParams,
  GoUsbAiRequestMethod,
  GoUsbAiTransport
} from "./go-usb-ai-transport.types.js";

export type GoUsbAiClientOptions = {
  baseUrl: string;
  transport?: GoUsbAiTransport;
  headers?: Record<string, string>;
  token?: string;
  requestTimeoutMs?: number;
  fetchImpl?: typeof fetch;
  webSocketFactory?: (url: string) => GoUsbAiWebSocketLike;
};

export type GoUsbAiRequestOptions = {
  method?: GoUsbAiRequestMethod;
  body?: unknown;
  query?: GoUsbAiQueryParams;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type GoUsbAiUploadOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type GoUsbAiRealtimeSubscribeOptions = {
  reconnectDelayMs?: number;
  onError?: (error: unknown) => void;
};

export type GoUsbAiRealtimeHandler = (event: GoUsbAiRealtimeEvent) => void;
