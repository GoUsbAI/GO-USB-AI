# GoUsbAi Hermes HTTP Adapter

This package exposes a standalone NCP-over-HTTP adapter for Hermes API Server.

It is intentionally not a Hermes-specific GoUsbAi runtime. GoUsbAi keeps using the generic `http-runtime` kind, while this server translates that runtime contract into Hermes' OpenAI-compatible `/v1/chat/completions` streaming API.

## Start

```bash
pnpm -C packages/go-usb-ai-ncp-runtime-adapter-hermes-http build
go-usb-ai-hermes-http-adapter \
  --port 8765 \
  --hermes-base-url http://127.0.0.1:8642 \
  --api-key change-me-local-dev
```

Environment variables are also supported:

```bash
GOUSB_AI_HERMES_ADAPTER_PORT=8765
HERMES_API_BASE_URL=http://127.0.0.1:8642
HERMES_API_KEY=change-me-local-dev
HERMES_MODEL=hermes-agent
```

## GoUsbAi Runtime Entry

Point a `type: "narp-http"` runtime entry at this adapter:

```json
{
  "label": "Hermes",
  "type": "narp-http",
  "config": {
    "baseUrl": "http://127.0.0.1:8765",
    "basePath": "/ncp/agent",
    "healthcheckUrl": "http://127.0.0.1:8765/health",
    "recommendedModel": "hermes-agent",
    "supportedModels": ["hermes-agent"]
  }
}
```

## Contract

The adapter exposes:

- `GET /health`
- `POST /ncp/agent/send`
- `GET /ncp/agent/stream?sessionId=...`
- `POST /ncp/agent/abort`

Hermes conversation continuity is preserved through `X-Hermes-Session-Id`, stored per GoUsbAi `sessionId`.
