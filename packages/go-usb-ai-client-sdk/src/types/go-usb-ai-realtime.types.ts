import type { AppEvent, AppEventEnvelope } from "@go-usb-ai/shared";

export type GoUsbAiConnectionEvent =
  | { type: "connection.open"; payload?: Record<string, never> }
  | { type: "connection.close"; payload?: Record<string, never> }
  | { type: "connection.error"; payload?: { message?: string } };

export type GoUsbAiRealtimeEvent = AppEvent | AppEventEnvelope | GoUsbAiConnectionEvent;

export type GoUsbAiWebSocketLike = {
  onopen: ((event: unknown) => void) | null;
  onmessage: ((event: { data?: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onclose: ((event: unknown) => void) | null;
  close: (code?: number, reason?: string) => void;
};

export type GoUsbAiRealtimeSubscription = {
  close: () => void;
};
