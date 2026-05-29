# Troubleshooting

This page is for recovery, not onboarding. When something fails, narrow it down in this order.

## 1. Is the service running?

```bash
go-usb-ai status
go-usb-ai doctor
```

If the service is not running, start it:

```bash
go-usb-ai start
```

If the state is abnormal, try:

```bash
go-usb-ai restart
```

## 2. The UI does not open

Check:

- the URL is `http://127.0.0.1:55667`
- the service is actually running
- the port is not occupied
- logs do not show a startup error

## 3. The model does not reply

Check:

- the provider was saved
- the API key or login state is valid
- the default model exists
- the machine can reach the provider

## 4. A channel cannot connect

Check:

- token expiration
- channel permissions
- platform callback or network reachability
- `go-usb-ai channels status`

## 5. Automation does not trigger

Check:

- the job is enabled
- the schedule matches your expectation
- the service was running at trigger time
- the job is not bound to the wrong session

## Useful diagnostics

```bash
go-usb-ai status --verbose
go-usb-ai doctor --verbose
go-usb-ai service autostart doctor
go-usb-ai remote doctor
```

## Still stuck?

Collect:

- GoUsbAi version
- operating system
- installation method
- `go-usb-ai status` output
- `go-usb-ai doctor` output
- reproduction steps
