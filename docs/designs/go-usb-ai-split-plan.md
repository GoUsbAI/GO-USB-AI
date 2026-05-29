# GoUsbAi Package Split Plan

## Goal
Separate CLI entry, runtime core, and UI/API server to improve maintainability, testability, and reuse.

## Target Packages
- `go-usb-ai-core`
  - Runtime core: agent loop, providers, channels, config, cron/heartbeat, sessions, utils
  - Exposes public APIs used by CLI/server
- `go-usb-ai-server`
  - UI/API server (Hono) + config API + websocket events
  - Depends on `go-usb-ai-core`
- `go-usb-ai` (existing)
  - CLI only, plus re-exports of core (keep current public API stable)
  - Wires `go-usb-ai-core` + `go-usb-ai-server`

## Module Moves
From `packages/go-usb-ai/src` to `packages/go-usb-ai-core/src`:
- `agent/`, `bus/`, `channels/`, `config/`, `cron/`, `heartbeat/`, `providers/`, `session/`, `utils/`, `index.ts`

From `packages/go-usb-ai/src` to `packages/go-usb-ai-server/src`:
- `ui/` (server, router, config, types)

## API Surface
`go-usb-ai-core` will export:
- Config: `loadConfig`, `saveConfig`, `getConfigPath`, `getDataDir`, `ConfigSchema`, `Config` type
- Runtime: `AgentLoop`, `MessageBus`, `ChannelManager`, `SessionManager`, `CronService`, `HeartbeatService`
- Providers: `PROVIDERS`, `LiteLLMProvider`, registry helpers
- Utilities: `getWorkspacePath`, `getWorkspacePathFromConfig`, `APP_NAME`, `APP_TAGLINE`, etc.
- Channel helpers used by server: `probeFeishu`

`go-usb-ai-server` will export:
- `startUiServer`
- UI router/config helpers

`go-usb-ai` will:
- Keep CLI entry
- Re-export core from `src/index.ts`

## Build/Publish
- Add build scripts for `go-usb-ai-core` and `go-usb-ai-server` (tsup + dts)
- Update root scripts to build core/server before CLI
- Keep `go-usb-ai` publishable; new packages can be private initially

## Validation
- `pnpm -C packages/go-usb-ai-core tsc`
- `pnpm -C packages/go-usb-ai-server tsc`
- `pnpm -C packages/go-usb-ai tsc`
- `pnpm -C packages/go-usb-ai build`
