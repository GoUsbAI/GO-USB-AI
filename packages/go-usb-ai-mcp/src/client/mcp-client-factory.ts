import { Agent, fetch as undiciFetch } from "undici";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { Config, McpTransportHttp, McpTransportSse, McpTransportStdio } from "@go-usb-ai/core";
import type { McpServerRecord } from "../types.js";

type McpClientHandle = {
  client: Client;
  transport: Transport;
};

function createClient(): Client {
  return new Client({
    name: "go-usb-ai-mcp-client",
    version: "0.1.0"
  });
}

function buildFetch(transport: McpTransportHttp | McpTransportSse): typeof fetch {
  const timeoutMs = transport.timeoutMs;
  const insecureAgent = transport.verifyTls ? null : new Agent({
    connect: {
      rejectUnauthorized: false
    }
  });

  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const undiciInit: Parameters<typeof undiciFetch>[1] = {
        ...init,
        dispatcher: insecureAgent ?? (init as { dispatcher?: Agent } | undefined)?.dispatcher,
        signal: controller.signal
      } as Parameters<typeof undiciFetch>[1];
      return await undiciFetch(input as string | URL, undiciInit) as unknown as Response;
    } finally {
      clearTimeout(timeout);
    }
  };
}

function resolvePathVariables(value: string): string {
  // Replace ${GOUSB_AI_HOME} with environment variable or process.cwd()
  return value.replace(/\$\{GOUSB_AI_HOME\}/g, process.env.GOUSB_AI_HOME || process.cwd());
}

function createStdioTransport(transport: McpTransportStdio): Transport {
  const resolvedCwd = transport.cwd ? resolvePathVariables(transport.cwd) : undefined;
  const resolvedArgs = transport.args?.map(arg => resolvePathVariables(arg));
  const resolvedCommand = resolvePathVariables(transport.command);
  
  return new StdioClientTransport({
    command: resolvedCommand,
    args: resolvedArgs,
    cwd: resolvedCwd,
    env: Object.keys(transport.env).length > 0 ? transport.env : undefined,
    stderr: transport.stderr
  });
}

function createHttpTransport(transport: McpTransportHttp): Transport {
  return new StreamableHTTPClientTransport(new URL(transport.url), {
    requestInit: {
      headers: transport.headers
    },
    fetch: buildFetch(transport)
  });
}

function createSseTransport(transport: McpTransportSse): Transport {
  return new SSEClientTransport(new URL(transport.url), {
    requestInit: {
      headers: transport.headers
    },
    eventSourceInit: {
      fetch: buildFetch(transport),
      headers: transport.headers
    } as RequestInit & { fetch: typeof fetch },
    fetch: buildFetch(transport)
  });
}

export class McpClientFactory {
  constructor(private readonly _config?: Config) {
    void this._config;
  }

  create(record: McpServerRecord): McpClientHandle {
    const transport = (() => {
      switch (record.definition.transport.type) {
        case "stdio":
          return createStdioTransport(record.definition.transport);
        case "http":
          return createHttpTransport(record.definition.transport);
        case "sse":
          return createSseTransport(record.definition.transport);
        default:
          throw new Error(`Unsupported MCP transport: ${String((record.definition.transport as { type?: string }).type)}`);
      }
    })();

    return {
      client: createClient(),
      transport
    };
  }
}
