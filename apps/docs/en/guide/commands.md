# Command Index

This is a lookup reference, not the onboarding path.  
If you are installing and starting GoUsbAi for the first time, use [Quickstart](/en/guide/getting-started).

## Core runtime

| Command | Purpose |
|---------|---------|
| `go-usb-ai start` | Start the background service and UI |
| `go-usb-ai restart` | Restart the service |
| `go-usb-ai stop` | Stop the service |
| `go-usb-ai serve` | Run in the foreground for debugging |
| `go-usb-ai status` | Inspect runtime status |
| `go-usb-ai doctor` | Run diagnostics |
| `go-usb-ai update` | Update the runtime |
| `go-usb-ai usage` | View usage snapshots |

## Host management

| Command | Purpose |
|---------|---------|
| `go-usb-ai service install-systemd --user` | Install a Linux user-level systemd service |
| `sudo go-usb-ai service install-systemd --system` | Install a Linux system-level systemd service |
| `go-usb-ai service install-launch-agent` | Install a macOS LaunchAgent |
| `go-usb-ai service install-task` | Install a Windows scheduled task |
| `go-usb-ai service autostart status` | Inspect autostart state |
| `go-usb-ai service autostart doctor` | Diagnose autostart configuration |

## Remote access

| Command | Purpose |
|---------|---------|
| `go-usb-ai remote enable` | Enable remote access |
| `go-usb-ai remote disable` | Disable remote access |
| `go-usb-ai remote status` | Inspect remote access state |
| `go-usb-ai remote doctor` | Diagnose remote access |

## Configuration

| Command | Purpose |
|---------|---------|
| `go-usb-ai config get <path>` | Read configuration |
| `go-usb-ai config set <path> <value>` | Write configuration |
| `go-usb-ai config unset <path>` | Remove configuration |

## Secrets

| Command | Purpose |
|---------|---------|
| `go-usb-ai secrets audit` | Audit secret references |
| `go-usb-ai secrets configure` | Configure secret provider behavior |
| `go-usb-ai secrets reload` | Reload secrets |

## Channels

| Command | Purpose |
|---------|---------|
| `go-usb-ai channels status` | Inspect channel state |
| `go-usb-ai channels login` | Log in to supported QR-code channels |
| `go-usb-ai channels add` | Add channel configuration |

## Automation

| Command | Purpose |
|---------|---------|
| `go-usb-ai cron list` | List jobs |
| `go-usb-ai cron add` | Add a job |
| `go-usb-ai cron remove <jobId>` | Remove a job |
| `go-usb-ai cron enable <jobId>` | Enable a job |
| `go-usb-ai cron disable <jobId>` | Disable a job |
| `go-usb-ai cron run <jobId>` | Run a job immediately |

## Extensions and Skills

| Command | Purpose |
|---------|---------|
| `go-usb-ai plugins list` | List plugins |
| `go-usb-ai plugins install <spec>` | Install a plugin |
| `go-usb-ai plugins enable <id>` | Enable a plugin |
| `go-usb-ai skills installed` | List installed skills |
| `go-usb-ai marketplace skills search` | Search marketplace skills |
| `go-usb-ai marketplace skills install <slug>` | Install a marketplace skill |

## Agent

| Command | Purpose |
|---------|---------|
| `go-usb-ai agent` | Terminal chat |
| `go-usb-ai agent -m "message"` | Send a one-shot message |
| `go-usb-ai agents list` | List agents |
| `go-usb-ai agents runtimes` | List runtimes |

## Related docs

- [Core Commands](/en/guide/core-commands)
- [Troubleshooting](/en/guide/troubleshooting)
- [Runtime & Hosting](/en/guide/runtime-hosting)
