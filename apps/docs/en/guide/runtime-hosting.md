# Runtime & Hosting Manual

This manual explains how GoUsbAi can stay available. Use it to choose between foreground runtime, background runtime, autostart, remote access, and Docker.

## Runtime options

| Option | Best for |
|--------|----------|
| `go-usb-ai start` | Daily local use with a background service |
| `go-usb-ai serve` | Foreground debugging and log observation |
| Autostart | Recovering after login or reboot |
| Docker | Server or container deployment |
| Remote access | Opening this instance from another device |

## Recommended choices

- trying it first: `go-usb-ai start`
- using it daily: background runtime plus autostart
- accessing it from phone or another device: remote access
- hosting it on a server: Docker or a system-level service

## Important boundary

`npm i -g go-usb-ai` does not register autostart.  
Installing the CLI and installing a host-managed service are separate actions.

## Related guides

- [Background & Autostart](/en/guide/background-autostart)
- [Remote Access](/en/guide/remote-access)
- [Docker Deployment](/en/guide/tutorials/docker-one-click)
