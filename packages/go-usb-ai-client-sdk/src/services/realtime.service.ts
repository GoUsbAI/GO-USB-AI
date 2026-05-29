import type {
  GoUsbAiRealtimeHandler,
  GoUsbAiRealtimeSubscribeOptions,
  GoUsbAiClientOptions
} from "../types/go-usb-ai-request.types.js";
import type {
  GoUsbAiRealtimeEvent,
  GoUsbAiRealtimeSubscription,
  GoUsbAiWebSocketLike
} from "../types/go-usb-ai-realtime.types.js";
import { resolveWebSocketUrl } from "../utils/url.utils.js";

export class RealtimeService {
  private readonly baseUrl: string;
  private readonly transport;
  private readonly webSocketFactory?: (url: string) => GoUsbAiWebSocketLike;

  constructor(private readonly options: GoUsbAiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.transport = options.transport;
    this.webSocketFactory = options.webSocketFactory;
  }

  readonly subscribe = (
    handler: GoUsbAiRealtimeHandler,
    options: GoUsbAiRealtimeSubscribeOptions = {}
  ): GoUsbAiRealtimeSubscription => {
    if (this.transport?.subscribe) {
      const unsubscribe = this.transport.subscribe(handler);
      return {
        close: () => {
          unsubscribe();
        }
      };
    }

    let socket: GoUsbAiWebSocketLike | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedManually = false;
    const reconnectDelayMs = Math.max(200, options.reconnectDelayMs ?? 1000);

    const cleanupTimer = (): void => {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const emit = (event: GoUsbAiRealtimeEvent): void => {
      handler(event);
    };

    const connect = (): void => {
      try {
        socket = this.createSocket(resolveWebSocketUrl(this.baseUrl, "/ws"));
      } catch (error) {
        options.onError?.(error);
        if (!closedManually) {
          reconnectTimer = setTimeout(connect, reconnectDelayMs);
        }
        return;
      }

      socket.onopen = () => {
        emit({ type: "connection.open" });
      };

      socket.onmessage = (event) => {
        const parsed = this.parseEvent(event.data);
        if (parsed) {
          emit(parsed);
        }
      };

      socket.onerror = (event) => {
        options.onError?.(event);
        emit({ type: "connection.error", payload: { message: "WebSocket error" } });
      };

      socket.onclose = () => {
        emit({ type: "connection.close" });
        socket = null;
        if (!closedManually) {
          cleanupTimer();
          reconnectTimer = setTimeout(connect, reconnectDelayMs);
        }
      };
    };

    connect();

    return {
      close: () => {
        closedManually = true;
        cleanupTimer();
        socket?.close();
        socket = null;
      }
    };
  };

  private readonly createSocket = (url: string): GoUsbAiWebSocketLike => {
    if (this.webSocketFactory) {
      return this.webSocketFactory(url);
    }
    if (typeof globalThis.WebSocket !== "function") {
      throw new Error("WebSocket is unavailable. Provide webSocketFactory when creating the client.");
    }
    return new globalThis.WebSocket(url) as unknown as GoUsbAiWebSocketLike;
  };

  private readonly parseEvent = (value: unknown): GoUsbAiRealtimeEvent | null => {
    if (typeof value !== "string") {
      return null;
    }
    try {
      const parsed = JSON.parse(value) as GoUsbAiRealtimeEvent;
      return parsed && typeof parsed === "object" && "type" in parsed ? parsed : null;
    } catch {
      return null;
    }
  };
}
