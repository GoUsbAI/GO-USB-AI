# @go-usb-ai/ncp-toolkit

Toolkit implementations built on top of `@go-usb-ai/ncp` protocol contracts.

## Build

```bash
pnpm -C packages/ncp-packages/go-usb-ai-ncp-toolkit build
```

## Scope

- Reference conversation-state manager implementations
- Protocol-level helper logic that depends on `@go-usb-ai/ncp` contracts
- Default in-memory adapter: `InMemoryAgentSessionStore`
- In-process adapter helper: `createAgentClientFromServer`
- Runtime throwable helper: `NcpErrorException`
