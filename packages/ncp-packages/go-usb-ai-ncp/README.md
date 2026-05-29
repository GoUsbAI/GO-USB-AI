# @go-usb-ai/ncp

Core protocol types and endpoint abstractions for universal communication in GoUsbAi.

## Build

```bash
pnpm -C packages/ncp-packages/go-usb-ai-ncp build
```

## Scope

- NCP manifest, message, session, and error definitions
- Endpoint interfaces (`NcpEndpoint`, `NcpAgentServerEndpoint`, `NcpAgentClientEndpoint`)

## Usage

See [docs/USAGE.md](docs/USAGE.md) for real-world scenarios and example code (in-process endpoint, bridging two endpoints, agent adapter).
