# Remote Access

Remote access lets you open the GoUsbAi instance running on this machine from another device. It is for users who already have a working local instance and want to turn it into a personal remote console.

## Before you start

You should already have:

- completed the [Quickstart](/en/guide/getting-started)
- one working model provider
- normal `go-usb-ai status`

If the service itself is not working yet, do not start with remote access.

## Good use cases

- access the GoUsbAi instance on your home computer from a phone or tablet
- access a server-hosted GoUsbAi from another machine
- place your local instance behind a controlled remote entry point

## Basic commands

```bash
go-usb-ai remote enable
go-usb-ai remote status
go-usb-ai remote doctor
go-usb-ai remote disable
```

Use `remote doctor` to check whether the remote access path is ready.

## Security notes

Remote access changes who can reach your instance. Before enabling it, confirm:

- you know who can access the entry point
- tokens or login state are not exposed
- the tunnel or reverse proxy is trusted
- the local management UI is not exposed to an untrusted network

## Related docs

- [Background & Autostart](/en/guide/background-autostart)
- [Docker Deployment](/en/guide/tutorials/docker-one-click)
- [Troubleshooting](/en/guide/troubleshooting)
