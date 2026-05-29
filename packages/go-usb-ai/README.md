# go-usb-ai

Turn your computer into a powerful AI assistant that coordinates agents, skills, CLI tools, automations, and messaging apps.

## Install

```bash
npm i -g go-usb-ai
```

## Quick start

```bash
go-usb-ai start
```

Then open `http://127.0.0.1:55667`.

On a VPS, GoUsbAi serves plain HTTP on `55667`. Use `http://<server-ip>:55667` directly for a quick check, or put Nginx/Caddy in front for `80/443`. `https://` must be terminated by the reverse proxy, not by GoUsbAi itself.

## Common commands

```bash
go-usb-ai --version
go-usb-ai status
go-usb-ai stop
go-usb-ai update
```

## Docs

- Product docs: https://docs.go-usb-ai.io
- Repository: https://github.com/Peiiii/go-usb-ai
- Changelog: https://github.com/Peiiii/go-usb-ai/blob/master/packages/go-usb-ai/CHANGELOG.md
- Iteration logs: https://github.com/Peiiii/go-usb-ai/tree/master/docs/logs
