import type { GoUsbAiRealtimeEvent } from "./go-usb-ai-realtime.types.js";

export type GoUsbAiRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type GoUsbAiQueryValue = string | number | boolean | null | undefined;

export type GoUsbAiQueryParams =
  | URLSearchParams
  | Record<string, GoUsbAiQueryValue | readonly GoUsbAiQueryValue[]>;

export type GoUsbAiTransportRequestInput = {
  method: GoUsbAiRequestMethod;
  path: string;
  body?: unknown;
  query?: GoUsbAiQueryParams;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type GoUsbAiTransportUploadInput = {
  path: string;
  formData: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type GoUsbAiTransport = {
  request<T>(input: GoUsbAiTransportRequestInput): Promise<T>;
  upload?<T>(input: GoUsbAiTransportUploadInput): Promise<T>;
  subscribe?(handler: (event: GoUsbAiRealtimeEvent) => void): () => void;
};
