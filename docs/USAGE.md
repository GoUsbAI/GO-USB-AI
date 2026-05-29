# GoUsbAi User Guide

This guide covers installation, configuration, channels, tools, automation, and troubleshooting for GoUsbAi.

---

## AI Self-Management Contract

When GoUsbAi AI needs to operate the product itself (version/status/doctor/service/plugins/channels/config/agents/cron/remote/update), follow these rules:

1. **Read the built-in self-management guide first**. The packaged runtime copy lives at `packages/go-usb-ai/resources/USAGE.md`, and this repo page is kept aligned with it.
2. **Use the exact command for the intent**: use `go-usb-ai --version` for version lookup; do not infer version from `status`.
3. **Prefer machine-readable output** (`--json`) whenever available.
4. **Discover runtime HTTP addresses from `go-usb-ai status --json`** before calling local APIs or `/webhook`; use `endpoints.uiUrl` and `endpoints.apiUrl` instead of guessing ports.
5. **Close the loop after changes** with `go-usb-ai status --json` (and `go-usb-ai doctor --json` when needed).
6. **Be explicit about restart semantics** (hot-apply, auto-restart, or manual restart required).
7. **Never invent commands**; use documented commands or `go-usb-ai --help` / `go-usb-ai <subcommand> --help`.
8. **Desktop-installed AI uses the same command names**. When GoUsbAi Desktop launches the runtime, it exposes a managed `go-usb-ai` command surface to AI command tools, so self-management commands keep using `go-usb-ai ...` without requiring a global NPM install.

---

## Table of contents

- [AI Self-Management Contract](#ai-self-management-contract)
- [Quick Start](#quick-start)
- [Public Server Deployment](#public-server-deployment)
- [HTTP Webhook Ingress](#http-webhook-ingress)
- [Configuration](#configuration)
- [Input context budget](#input-context-budget)
- [Multi-agent routing & session isolation](#multi-agent-routing--session-isolation-openclaw-aligned)
- [Session management (UI)](#session-management-ui)
- [Workspace](#workspace)
- [Commands](#commands)
- [Channels](#channels)
- [Tools](#tools)
- [Cron](#cron)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

1. Install with npm:

   ```bash
   npm i -g go-usb-ai
   ```

2. Start the service (gateway + config UI in the background):

   ```bash
   go-usb-ai start
   ```

3. Open **http://127.0.0.1:55667** in your browser. Set a provider (e.g. OpenRouter) and model in the UI.

4. Optionally run `go-usb-ai init` to create a workspace with agent templates, or chat from the CLI:

   ```bash
   go-usb-ai agent -m "Hello!"
   ```

5. Stop the service when done:

   ```bash
   go-usb-ai stop
   ```

For internet access on a VPS:

- GoUsbAi itself serves plain HTTP on port `55667`.
- Direct access is `http://<server-ip>:55667`.
- If you want `https://` or standard `80/443`, put Nginx/Caddy in front and proxy to `http://127.0.0.1:55667`.
- Do not point a reverse proxy upstream to `https://127.0.0.1:55667`; GoUsbAi does not terminate TLS itself.

---

## Public Server Deployment

GoUsbAi binds the UI to `0.0.0.0` by default, but the built-in server is still an HTTP server. For a public VPS, use one of these two patterns:

1. Direct HTTP for quick validation:

   ```text
   http://<server-ip>:55667
   ```

2. Recommended: terminate TLS in Nginx/Caddy and proxy to local GoUsbAi HTTP:

   ```nginx
   server {
     listen 80;
     server_name _;

     location / {
       proxy_pass http://127.0.0.1:55667;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
     }
   }
   ```

Important rules:

- GoUsbAi upstream must stay `http://127.0.0.1:55667`.
- `443` belongs to Nginx/Caddy plus your certificate, not to GoUsbAi directly.
- If you later add HTTPS, keep TLS termination in the reverse proxy, then forward to `http://127.0.0.1:55667`.

Minimal verification sequence:

```bash
curl http://127.0.0.1:55667/api/health
curl -I http://127.0.0.1:55667/
curl -I http://<server-ip>/
```

If `127.0.0.1:55667` is healthy but the public entry returns `502`, the problem is in your reverse proxy, firewall, or upstream target, not in the GoUsbAi HTTP server.

---

## HTTP Webhook Ingress

GoUsbAi exposes a generic webhook ingress for external systems and small local tools that need to trigger GoUsbAi work:

```text
POST /webhook
```

This section is intentionally only an index. Read the focused guide only when you need to implement or debug a webhook caller:

- [HTTP webhook ingress guide](usage/http-webhook-ingress.md)

For AI or scripts, do not guess the port. Discover the running service first:

```bash
go-usb-ai status --json
```

Read these fields:

- `endpoints.uiUrl`: base URL for UI and `/webhook`, for example `http://127.0.0.1:55667`.
- `endpoints.apiUrl`: base URL for API routes, for example `http://127.0.0.1:55667/api`.
- `remote.runtime.localOrigin`: local origin used by the service-managed remote connector when remote access is enabled.

Then call:

```text
<endpoints.uiUrl>/webhook
```

Current third-party trigger entry:

```json
{
  "type": "agent-run.send",
  "payload": {
    "content": [
      { "type": "text", "text": "Reply exactly: Webhook smoke received" }
    ]
  }
}
```

Unknown ingress types are rejected instead of being turned into chat messages. Use the focused guide for full payload fields, existing-session calls, verification, and error semantics.

---

## Configuration

- **Config file:** `~/.go-usb-ai/config.json`
- **Data directory:** Override with `GOUSB_AI_HOME=/path/to/dir` (config path becomes `$GOUSB_AI_HOME/config.json`).

### Minimal config

```json
{
  "providers": {
    "openrouter": { "apiKey": "sk-or-v1-xxx" }
  },
  "agents": {
    "defaults": { "model": "minimax/MiniMax-M2.5" }
  }
}
```

### Provider examples

**OpenRouter (recommended)**

```json
{
  "providers": { "openrouter": { "apiKey": "sk-or-v1-xxx" } },
  "agents": { "defaults": { "model": "minimax/MiniMax-M2.5" } }
}
```

**MiniMax (Mainland China)**

```json
{
  "providers": {
    "minimax": {
      "apiKey": "sk-api-xxx",
      "apiBase": "https://api.minimaxi.com/v1"
    }
  },
  "agents": { "defaults": { "model": "minimax/MiniMax-M2.5" } }
}
```

**Local vLLM (or any OpenAI-compatible server)**

```json
{
  "providers": {
    "vllm": {
      "apiKey": "dummy",
      "apiBase": "http://localhost:8000/v1"
    }
  },
  "agents": { "defaults": { "model": "meta-llama/Llama-3.1-8B-Instruct" } }
}
```

Supported providers include OpenRouter, OpenAI, Anthropic, MiniMax, Moonshot, Gemini, DeepSeek, DashScope, Zhipu, Groq, vLLM, and AiHubMix. You can configure them in the UI or by editing `config.json`.

### Runtime config apply behavior (no restart)

When the gateway is already running, config changes from the UI or `go-usb-ai config set` are hot-applied for these paths:

- `providers.*`
- `channels.*`
- `agents.defaults.model`
- `agents.context.*`
- `tools.*`
- `companion.enabled`
- `plugins.*` (v1 hot plugin runtime: plugin registry/channel gateways/channels are hot-reloaded)

Restart is still required for:

- UI bind port (`--port` / `--ui-port`)

To confirm hot reload succeeded, check gateway console logs or `${GOUSB_AI_HOME:-~/.go-usb-ai}/logs/service.log` for messages like `Config reload: plugins reloaded.` / `Config reload: plugin channel gateways restarted.` / `Config reload: channels restarted.`

Runtime logs live under `${GOUSB_AI_HOME:-~/.go-usb-ai}/logs/`:

- `service.log`: current runtime log
- `crash.log`: fatal / startup / uncaught crash log
- `archive/*.log`: rotated history files with timestamps

Useful commands:

- `go-usb-ai logs path`
- `go-usb-ai logs tail`
- `go-usb-ai logs tail --crash`

UI note: **Model** page save persists `agents.defaults.model` only.

### Multi-agent routing & session isolation (OpenClaw-aligned)

For agent identities themselves, do **not** create them through `Routing & Runtime` or direct `agents.list` edits.
Use one of these two entry points instead:

- `Agents` page in the chat workspace
- CLI: `go-usb-ai agents new <agent-id>`

`Routing & Runtime` is only for routing/runtime policy after agents already exist:

- `bindings`: route inbound messages by `channel + accountId (+peer)` to a target `agentId`
- `session.dmScope`: DM isolation strategy (`main` / `per-peer` / `per-channel-peer` / `per-account-channel-peer`)

> ⚠️ **Strict enum guard (OpenClaw-aligned):** `session.dmScope` accepts **only** these 4 values: `main`, `per-peer`, `per-channel-peer`, `per-account-channel-peer`.
> Any other value (for example `per-account-channel-peer-agent`) is invalid and must not be written.

See full architecture details in [Multi-Agent Architecture](https://docs.go-usb-ai.io/en/guide/multi-agent).

Example:

```json
{
  "bindings": [
    {
      "agentId": "engineer",
      "match": {
        "channel": "discord",
        "accountId": "zongzhihui",
        "peer": { "kind": "channel", "id": "dev-room" }
      }
    }
  ],
  "session": {
    "dmScope": "per-account-channel-peer"
  }
}
```

CLI equivalents:

```bash
go-usb-ai agents new engineer --json
go-usb-ai config set bindings '[{"agentId":"engineer","match":{"channel":"discord","accountId":"zongzhihui"}}]' --json
go-usb-ai config set session.dmScope '"per-account-channel-peer"' --json
```

### Multi-agent collaboration playbook (recommended)

Use this baseline for predictable team-style collaboration:

1. Keep `main` as the default fallback role.
2. Create specialist agents through the `Agents` page or `go-usb-ai agents new` (for example `engineer`, `ops`, `support`).
3. Route stable traffic classes with `bindings` (channel/account/peer based).
4. Use `session.dmScope="per-account-channel-peer"` for multi-account + multi-channel isolation.

Suggested role split:

- `main`: default reception, broad Q&A, fallback when no binding matches.
- `engineer`: technical channels / dev rooms.
- `ops`: deployment/monitoring channels.
- `support`: customer-facing groups.

### Binding match semantics (deterministic)

`bindings` are processed in array order, and the **first matching rule wins**.

- `match.channel` is required for a valid match.
- `match.accountId`:
  - omitted/empty => matches only account `default`
  - `"*"` => matches all accounts
  - specific value => matches that normalized account id
- `match.peer` omitted => matches all peers under the selected channel/account scope.
- if no binding matches, routing falls back to the default agent (`agents.list[].default`, otherwise first agent, otherwise `main`).

Example with explicit precedence (more specific rule first):

```json
{
  "bindings": [
    {
      "agentId": "engineer",
      "match": {
        "channel": "discord",
        "accountId": "zongzhihui",
        "peer": { "kind": "channel", "id": "dev-room" }
      }
    },
    {
      "agentId": "support",
      "match": {
        "channel": "discord",
        "accountId": "*"
      }
    }
  ]
}
```

### Collaboration recipes

Recipe A — default + specialist routing:

```bash
go-usb-ai agents new engineer --json
go-usb-ai config set bindings '[{"agentId":"engineer","match":{"channel":"discord","accountId":"zongzhihui","peer":{"kind":"channel","id":"dev-room"}}}]' --json
```

Recipe B — multi-account safe isolation:

```bash
go-usb-ai config set session.dmScope '"per-account-channel-peer"' --json
```

Recipe C — reduce noisy group triggering:

```bash
go-usb-ai config set channels.discord.requireMention true --json
go-usb-ai config set channels.discord.groupPolicy '"allowlist"' --json
go-usb-ai config set channels.discord.groupAllowFrom '["dev-room"]' --json
```

### Multi-agent acceptance checklist

1. Prepare at least two agents (`main` + one specialist).
2. Add at least one binding and verify inbound messages hit the expected role.
3. Verify DM isolation across user/channel/account boundaries under the selected `dmScope`.
4. If Discord/Telegram group collaboration is enabled, verify mention gating (`requireMention` / `mentionPatterns`) behavior.

Pass criteria: stable routing, no cross-session context leakage, predictable group triggering, explainable fallback behavior.

### Multi-agent troubleshooting quick map

- Routed to wrong agent:
  - check binding order (specific rules must be before broad rules)
  - confirm `match.accountId` and `match.peer` actually match inbound metadata
- Always falls back to `main`:
  - verify `bindings` is not empty and `match.channel` is correct
  - verify target `agentId` exists in `go-usb-ai agents list --json` or the `Agents` page
- Group messages not triggering:
  - check `groupPolicy`, `groupAllowFrom`, and `requireMention`
  - confirm message text matches configured `mentionPatterns` if enabled
- DM context looks mixed:
  - switch to `session.dmScope="per-account-channel-peer"`
  - re-test across two users/channels/accounts and compare outcomes

For internal AI operations (same as other built-in capabilities):

- Yes, the runtime registers the `gateway` tool (`config.get` / `config.schema` / `config.apply` / `config.patch`).
- The AI can use it to manage the same config surface when you explicitly ask.
- As with all config mutations, it follows the explicit-request rule (no silent self-mutation).
- **Required safe flow for AI config writes:**
  1. run `config.get` to read current config + hash;
  2. run `config.schema` and copy enum values exactly (no invented suffixes/variants);
  3. run `config.patch` with minimal patch;
  4. run `config.get` again to verify persisted value.

---

## Session management (UI)

GoUsbAi UI now provides an OpenClaw-aligned session operations panel (**Sessions** tab) with additional runtime controls:

- list sessions with search + active window filters
- switch grouping mode: all sessions (no grouping) or grouped by channel
- inspect session history (latest window)
- patch per-session metadata (`label`, `preferredModel`)
- clear one session history
- delete one session
- localized Sessions UI copy (i18n labels for the panel)

This is useful when running multi-agent routing and channel operations long term, because you can clean or retarget problematic sessions without hand-editing files.

## Agent chat in UI

GoUsbAi UI includes a first-class **Chat** tab so you can talk to your agent directly from browser:

- create/switch/delete sessions from the left panel
- filter session list by channel in the left panel
- inspect complete session history in the thread panel
- choose target agent before sending message
- send messages with Enter (Shift+Enter for newline)
- keep using the same session for multi-turn context
- stream assistant output in real time through the NCP UI agent endpoints (`/api/ncp/agent/*`)
- render assistant replies as Markdown (tables/code blocks/links)
- show tool calls/results as structured tool cards
- merge each full assistant turn (assistant + tool calls/results + follow-ups before next user input) into one card while preserving chronological order
- keep input editable while AI is streaming, and queue additional sends during busy turns

Notes:

- if provider credentials are missing, chat API will return a clear runtime error telling you to configure provider keys first
- session data is persisted in the same session store used by runtime/channels

---

## Workspace

- **Default path:** `~/.go-usb-ai/workspace`
- Override in config:

  ```json
  {
    "agents": { "defaults": { "workspace": "~/my-go-usb-ai" } }
  }
  ```

Initialize the workspace (creates template files if missing):

```bash
go-usb-ai init
```

Use `go-usb-ai init --force` to overwrite existing template files.

Created under the workspace:

| File / folder   | Purpose                          |
|-----------------|----------------------------------|
| `AGENTS.md`     | System instructions for the agent |
| `SOUL.md`       | Personality and values            |
| `USER.md`       | User profile hints                |
| `IDENTITY.md`   | Identity context                  |
| `TOOLS.md`      | Tool usage guidelines             |
| `BOOT.md` / `BOOTSTRAP.md` | Boot context               |
| `memory/MEMORY.md` | Long-term notes                |
| `skills/`       | Custom skills                     |

GoUsbAi's AI self-management guide is built into the app package and is not written into each workspace anymore.

Skill loading contract:

- GoUsbAi ships with built-in skills and auto-loads them directly from the app package.
- `<workspace>/skills/` is for custom skills and marketplace-installed skills.
- With the default workspace, the default skill directory is `~/.go-usb-ai/workspace/skills/`.
- Use `go-usb-ai skills installed` / `go-usb-ai skills info <selector>` for the **installed/local domain**.
- Use `go-usb-ai marketplace skills search|info|recommend|install` for the **marketplace/catalog domain**.
- `go-usb-ai skills install <slug>` remains available as a compatibility shortcut for marketplace installation into that directory.
- Built-in marketplace skills are already available by default; marketplace install does not copy them into the workspace when the target skill is built-in.
- Historical copied built-in skills under `<workspace>/skills/` are deprecated artifacts.
- If a built-in skill and a workspace skill share the same name, GoUsbAi ignores the workspace copy and uses the built-in definition as the source of truth.
- If you want to install into a specific project workspace, pass `--workdir <workspace>`.
- Upstream commands such as `npx skills add ... -g` do not install a skill into GoUsbAi's workspace and do not make it selectable in GoUsbAi by themselves.


---

## Commands

| Command | Description |
|---------|-------------|
| `go-usb-ai start` | Start gateway + UI in the background |
| `go-usb-ai restart` | Restart the background service with optional start flags |
| `go-usb-ai stop` | Stop the background service |
| `go-usb-ai service install-systemd --user` | Install a user-level Linux `systemd` service for GoUsbAi |
| `sudo go-usb-ai service install-systemd --system` | Install a system-wide Linux `systemd` service for GoUsbAi |
| `go-usb-ai service uninstall-systemd --user` | Remove a user-level Linux `systemd` service |
| `sudo go-usb-ai service uninstall-systemd --system` | Remove a system-wide Linux `systemd` service |
| `go-usb-ai service install-launch-agent` | Install a managed macOS LaunchAgent for GoUsbAi |
| `go-usb-ai service uninstall-launch-agent` | Remove a managed macOS LaunchAgent |
| `go-usb-ai service install-task` | Install a managed Windows Scheduled Task for GoUsbAi |
| `go-usb-ai service uninstall-task` | Remove a managed Windows Scheduled Task |
| `go-usb-ai service autostart status` | Show host autostart status |
| `go-usb-ai service autostart doctor` | Diagnose host autostart setup |
| `go-usb-ai ui` | Start UI and gateway in the foreground |
| `go-usb-ai gateway` | Start gateway only (for channels) |
| `go-usb-ai serve` | Run gateway + UI in the foreground (no background) |
| `go-usb-ai --version` | Show the installed GoUsbAi version |
| `go-usb-ai agent -m "message"` | Send a one-off message to the agent |
| `go-usb-ai agent` | Interactive chat in the terminal |
| `go-usb-ai agent --session <id> --model <model>` | Use a session-specific model/provider route (sticky for that session) |
| `go-usb-ai status` | Show runtime process/health/config status (`--json`, `--verbose`, `--fix`) |
| `go-usb-ai usage` | Show the latest observed LLM usage snapshot; add `--history`, `--stats`, `--limit <n>`, or `--json` for local usage history and prompt cache stats |
| `go-usb-ai init` | Initialize workspace and template files |
| `go-usb-ai init --force` | Re-run init and overwrite templates |
| `go-usb-ai agents list` | List built-in and created agents |
| `go-usb-ai agents runtimes` | List installed agent runtimes (`--json`, `--probe`) |
| `go-usb-ai agents new <agent-id>` | Create a new agent with default home/template/avatar |
| `go-usb-ai agents update <agent-id>` | Update an existing agent's display metadata |
| `go-usb-ai agents remove <agent-id>` | Remove an extra agent (built-in `main` cannot be removed) |
| `go-usb-ai login --api-base <url>` | Start browser sign-in for GoUsbAi Platform and save the platform token locally (`--no-open` for headless servers, `--email/--password` for direct fallback) |
| `go-usb-ai remote enable` | Enable service-managed remote access |
| `go-usb-ai remote disable` | Disable service-managed remote access |
| `go-usb-ai remote status` | Show remote runtime/config status |
| `go-usb-ai remote doctor` | Diagnose remote readiness |
| `go-usb-ai remote connect` | Foreground debug mode: register this machine and keep the connector online |
| `go-usb-ai update` | Self-update the CLI |
| `go-usb-ai plugins list` | List discovered OpenClaw-compatible plugins |
| `go-usb-ai plugins info <id>` | Show plugin details |
| `go-usb-ai plugins install <path-or-spec>` | Install plugin from local path/archive or npm spec |
| `go-usb-ai plugins uninstall <id>` | Uninstall plugin (with optional `--dry-run`) |
| `go-usb-ai plugins enable <id>` | Enable plugin in config |
| `go-usb-ai plugins disable <id>` | Disable plugin in config |
| `go-usb-ai plugins doctor` | Diagnose plugin loading issues |
| `go-usb-ai channels list --json` | List plugin channels for automation and agent channel discovery |
| `go-usb-ai channels status` | Show enabled channels and status |
| `go-usb-ai doctor` | Run runtime diagnostics (`--json`, `--verbose`, `--fix`) |
| `go-usb-ai channels login` | Open QR login for supported channels |
| `go-usb-ai channels add --channel <id> ...` | Configure plugin channel via setup adapter |
| `go-usb-ai cron list` | List all scheduled jobs, including disabled ones |
| `go-usb-ai cron add ...` | Add a cron job (see [Cron](#cron)) |
| `go-usb-ai cron remove <jobId>` | Remove a job |
| `go-usb-ai cron enable <jobId>` | Enable a disabled job |
| `go-usb-ai cron disable <jobId>` | Disable a job without deleting it |
| `go-usb-ai cron run <jobId>` | Run a job once (optionally with `--force` if disabled) |
| `go-usb-ai skills installed` | List installed skills from the local runtime (`--json`, `--scope`, `--query`) |
| `go-usb-ai skills info <selector>` | Show installed skill details from the local runtime (`--json`) |
| `go-usb-ai skills install <slug>` | Compatibility shortcut: install a marketplace skill into `<workspace>/skills/<slug>` |
| `go-usb-ai skills publish <dir>` | Upload/create a skill to marketplace |
| `go-usb-ai skills update <dir>` | Update an existing marketplace skill |
| `go-usb-ai marketplace skills search` | Search marketplace skills (`--json`, `--query`, `--tag`, `--sort`, `--page`, `--page-size`) |
| `go-usb-ai marketplace skills info <slug>` | Show marketplace skill details (`--json`) |
| `go-usb-ai marketplace skills recommend` | List recommended marketplace skills (`--json`, `--scene`, `--limit`) |
| `go-usb-ai marketplace skills install <slug>` | Install a marketplace skill using the explicit marketplace domain |
| `go-usb-ai config get <path>` | Get config value by path (use `--json` for structured output) |
| `go-usb-ai config set <path> <value>` | Set config value by path (use `--json` to parse value as JSON) |
| `go-usb-ai config unset <path>` | Remove config value by path |

Autostart notes:

- `npm i -g go-usb-ai` installs the CLI only. It does not register host autostart by itself.
- On Linux, use `go-usb-ai service install-systemd --user` for a user-level login autostart path.
- On macOS, use `go-usb-ai service install-launch-agent` for a LaunchAgent-based login autostart path. The agent runs once at login and does not supervise retries after the runtime exits.
- On Windows, use `go-usb-ai service install-task` for a Scheduled Task based login autostart path.
- For machine-wide Linux startup after boot, use `sudo go-usb-ai service install-systemd --system`.
- `go-usb-ai service autostart status` and `go-usb-ai service autostart doctor` are read-only inspection commands; add `--user` or `--system` only when you need an explicit Linux `systemd` scope.

Agent management notes:

- `go-usb-ai agents runtimes` accepts:
  - `--json`
  - `--probe` to actively check runtime readiness instead of only reporting lightweight observations
- `go-usb-ai agents new <agent-id>` accepts:
  - `--name <display-name>`
  - `--description <description>`
  - `--avatar <http-url-or-local-file>`
  - `--home <path>`
  - `--runtime <runtime-kind>`
  - `--json`
- `go-usb-ai agents update <agent-id>` accepts:
  - `--name <display-name>`
  - `--description <description>`
  - `--avatar <http-url-or-local-file>`
  - `--runtime <runtime-kind>`
  - `--json`
- `runtime` defaults to `native`.
- Use `go-usb-ai agents runtimes --json` before setting a non-default `runtime`; it returns the actual installed runtime kinds instead of requiring guesswork.
- The same runtime kinds are also what NCP `sessions_spawn` expects in its optional `runtime` field.
- `go-usb-ai agents update` allows updating the built-in `main` agent.
- For `go-usb-ai agents update`, passing an empty string to `--name`, `--description`, or `--avatar` clears the stored override for that field.
- If `--avatar` is a local file path, GoUsbAi copies it into the Agent Home Directory and stores it as `home://avatar.<ext>`.
- If `--avatar` is omitted, GoUsbAi generates a local default `avatar.svg`.
- `go-usb-ai agents new/update/remove --json` returns machine-readable output with the resulting Agent payload.

### Agent CRUD flow for AI self-management

When GoUsbAi AI is asked to create, update, or remove an Agent, use this exact flow instead of inventing config edits:

1. Inspect current agents when needed:

   ```bash
   go-usb-ai agents list --json
   ```

2. If you plan to set a non-default runtime, inspect installed runtime kinds first:

   ```bash
   go-usb-ai agents runtimes --json
   ```

3. Execute the dedicated command instead of editing config directly:

   ```bash
   go-usb-ai agents new <agent-id> --json [--name <display-name>] [--description <description>] [--avatar <url-or-local-file>] [--home <path>] [--runtime <runtime-kind>]
   go-usb-ai agents update <agent-id> --json [--name <display-name>] [--description <description>] [--avatar <url-or-local-file>] [--runtime <runtime-kind>]
   go-usb-ai agents remove <agent-id> --json
   ```

4. Treat the JSON output as the source of truth:
   - `agent`: created or updated Agent profile
   - `removed` + `agentId`: removal result

5. Close the loop:

   ```bash
   go-usb-ai agents list --json
   go-usb-ai status --json
   ```

6. Do not invent a restart step for normal Agent CRUD. Running services hot-apply `agents.list` changes through config reload, and subsequent requests should observe the updated Agent state directly.

Rules:

- Do not try to create or remove the built-in `main` agent. `go-usb-ai agents update main` is allowed.
- For normal Agent management, prefer `go-usb-ai agents list|new|update|remove --json` over direct `config.json` or `agents.list` edits.
- For runtime discovery, prefer `go-usb-ai agents runtimes --json` over guessing enum values from memory or stale examples.
- Direct `config.json` / `agents.list` edits are recovery-only: use them only for explicit operator-led disaster recovery, or when a documented CLI path still cannot express the requested change.
- Humans should use the `Agents` page or the CLI for Agent identities. `Routing & Runtime` is not the identity-management entry point.
- If the user asked AI to perform Agent CRUD, AI should run the command, not only describe it.
- Avatar guidance for AI-created agents:
  - When AI creates an Agent, prefer passing an explicit `--avatar` instead of relying on the generated fallback.
  - Prefer non-text avatars for long-lived Agent identities; avoid letter-based or initials-based avatar styles as the default recommendation.
  - DiceBear `initials` is a text-based avatar style and should not be the default recommendation for Agents.
  - If you use DiceBear or a similar deterministic service, prefer a non-text style with a stable seed derived from `agent-id` (or display name) so repeated creation yields a predictable identity.
  - Concrete example:

    ```bash
    go-usb-ai agents new researcher --json --name "Researcher" --avatar "https://api.dicebear.com/9.x/identicon/svg?seed=researcher"
    ```

  - If you want a different stable avatar, keep the same URL pattern but replace the seed with the final `agent-id` or display name.
  - Example providers may change over time; treat DiceBear as a replaceable suggestion rather than a built-in product dependency or a hardcoded runtime rule.
  - If the user prefers local-only assets, offline behavior, or does not want third-party avatar URLs, prefer passing a local image file path with `--avatar`.
  - Omit `--avatar` only as a last-resort fallback. The generated local `avatar.svg` is acceptable as a fallback, but it is not the preferred default for AI-created Agents.

Gateway options (when running `go-usb-ai gateway` or `go-usb-ai start`):

- `--ui` — enable the UI server with the gateway
- `--ui-port <port>` — UI port (default 55667 for start)
- `--ui-open` — open the browser when the UI starts

If service is already running, new UI port flags do not hot-apply; use `go-usb-ai restart ...` to apply them.

Remote access quick start:

1. Login once on that device: `go-usb-ai login --api-base https://ai-gateway-api.go-usb-ai.io/v1`.
   On a headless server, add `--no-open` and open the printed link from another device/browser.
2. Enable service-managed remote access: `go-usb-ai remote enable`.
3. Start your local GoUsbAi service: `go-usb-ai start`.
4. Check status if needed: `go-usb-ai remote status`.
5. Open the same account in GoUsbAi Platform, find the device under "我的设备", then click `Open`.

Notes:

- `go-usb-ai remote connect` is now the foreground debug path. It is useful for troubleshooting, but it is no longer the recommended daily workflow.
- `go-usb-ai status` now includes remote state summary, and `go-usb-ai remote doctor` focuses on remote-specific checks.

Status/diagnostics tips:

- `go-usb-ai --version` is the only supported way to query the installed CLI version.
- `go-usb-ai status` shows runtime truth (process + health + config summary).
- `go-usb-ai status --json` outputs machine-readable status and exits `0` when the command itself succeeds; use the JSON `level` field (`healthy` / `degraded` / `stopped`) to interpret runtime state.
- Use `go-usb-ai status --json` as the source of truth for local HTTP addresses. `endpoints.uiUrl` is the base for `/webhook`; `endpoints.apiUrl` is the base for `/api/*` calls.
- `go-usb-ai status --fix` safely clears stale service state if PID is dead.
- `go-usb-ai doctor` runs additional checks (state coherence, health, port availability, provider readiness).
- `go-usb-ai usage` shows the latest observed LLM usage snapshot from recent CLI agent runs or the local UI/NCP runtime.
- `go-usb-ai usage --history --limit 20` shows recent local usage records in reverse chronological order.
- `go-usb-ai usage --stats` aggregates the current local usage history into quick CLI-readable totals and cache-hit counts.
- `go-usb-ai usage --json` is the preferred machine-readable entry when an AI or script needs to inspect prompt cache usage fields such as `*_cached_tokens`; combine it with `--history` or `--stats` when needed.
- The latest snapshot is stored at `${GOUSB_AI_HOME:-~/.go-usb-ai}/run/llm-usage.json`.
- The local usage history is stored at `${GOUSB_AI_HOME:-~/.go-usb-ai}/logs/llm-usage.jsonl`.
- Current scope is intentionally lightweight: this local history file is not a full project-wide logging module yet.

OpenClaw-compatible plugin discovery paths:

- `${GOUSB_AI_HOME:-~/.go-usb-ai}/extensions`
- `<workspace>/.go-usb-ai/extensions`
- `plugins.load.paths` entries in config

Legacy OpenClaw directories are not scanned by default (`~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`).

Silent reply behavior:

- If the model contains `<noreply/>`, GoUsbAi does not send any channel reply.
- If the final normalized reply is empty/whitespace, GoUsbAi also keeps silent (no fallback text).
- This matches OpenClaw's core no-reply expectation while keeping logic minimal.

---

## Self-update

Use the built-in updater:

```bash
go-usb-ai update
```

Behavior:

- If `GOUSB_AI_UPDATE_COMMAND` is set, the CLI executes it (useful for custom update flows).
- Otherwise `go-usb-ai update` checks the runtime update channel, downloads the latest compatible runtime bundle, and applies it.
- Use `go-usb-ai update --check` to check without downloading or applying.
- Use `go-usb-ai update --download-only` to stage an update without switching the active runtime. `go-usb-ai update --apply` applies an already staged runtime update.
- If the background service is running, restart it after `go-usb-ai update` reports that the runtime update was applied.
- When update is triggered from the running gateway (agent `update.run`), GoUsbAi arms a self-relaunch helper before exiting, so the service comes back automatically (like an OS reboot flow).
- After restart, GoUsbAi automatically pings the last active session with restart/update status (including note when provided).

If the gateway is running, you can also ask the agent to update; the agent will call the gateway update tool only when you explicitly request it, and restart/relaunch will be scheduled afterward.

---

## Channels

All message channels use a common **allowFrom** rule:

- **Empty `allowFrom`** (`[]`): allow all senders.
- **Non-empty `allowFrom`**: only messages from the listed user IDs are accepted.

Configure channels in the UI at http://127.0.0.1:55667 or in `~/.go-usb-ai/config.json` under `channels`.

Use `go-usb-ai channels list --json` when an automation or AI agent needs exact runtime channel ids, default accounts, and bound user ids before calling messaging tools. Treat returned `channels[].id` values as authoritative; do not guess aliases such as `wechat` for the Weixin channel.

### Discord

1. Create a bot in the [Discord Developer Portal](https://discord.com/developers/applications) and get the bot token.
2. Enable **MESSAGE CONTENT INTENT** for the bot.
3. Invite the bot to your server with permissions to read and send messages.

```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "token": "YOUR_BOT_TOKEN",
      "allowBots": false,
      "allowFrom": [],
      "accountId": "zongzhihui",
      "streaming": "partial",
      "draftChunk": {
        "minChars": 200,
        "maxChars": 800,
        "breakPreference": "paragraph"
      },
      "dmPolicy": "open",
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["dev-room"],
      "requireMention": true,
      "mentionPatterns": ["@工程师", "@engineer"],
      "groups": {
        "dev-room": {
          "requireMention": true,
          "mentionPatterns": ["@engineer"]
        }
      }
    }
  }
}
```

- `allowBots` (default `false`): whether to accept bot-authored messages. Keep it `false` unless you explicitly need bot-to-bot flows.
- `streaming` (default `off`): Discord preview streaming mode (`off` | `partial` | `block` | `progress`). `progress` maps to `partial`.
- `draftChunk`: controls preview streaming chunk size and break style; larger values reduce edit frequency.
- `textChunkLimit` (default `2000`): outbound Discord message max chars per send/edit.

Discord native slash commands (auto-registered):

- `/help` or `/commands`
- `/whoami` or `/id`
- `/status`
- `/reset` or `/new`
- `/model [name|clear]`

### Telegram

1. Create a bot via [@BotFather](https://t.me/BotFather) and get the token.
2. Get your user ID (e.g. from [@userinfobot](https://t.me/userinfobot)).
3. Add your user ID to `allowFrom` to restrict who can use the bot.

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "token": "YOUR_BOT_TOKEN",
      "allowFrom": ["YOUR_USER_ID"],
      "ackReaction": "👀",
      "ackReactionScope": "all",
      "accountId": "zongzhihui",
      "dmPolicy": "open",
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["GROUP_ID"],
      "requireMention": true,
      "mentionPatterns": ["@工程师", "@engineer"],
      "groups": {
        "GROUP_ID": {
          "requireMention": true,
          "mentionPatterns": ["@engineer"]
        }
      }
    }
  }
}
```

Optional: set `"proxy": "http://localhost:7890"` (or your proxy URL) for network access.

Telegram ack reaction defaults:

- `ackReaction` default is `"👀"` (set empty string to disable emoji reaction).
- `ackReactionScope` default is `"all"` (`off` | `group-mentions` | `group-all` | `direct` | `all`).

Telegram Bot API behavior note:

- In **groups**, bots generally do **not** receive messages from other bots.
- For bot-to-bot scenarios, prefer **Telegram channels**. GoUsbAi now processes `channel_post` updates as inbound messages.

### Slack

Socket mode is the typical setup. You need a **Bot Token** and an **App-Level Token** (with `connections:write`).

```json
{
  "channels": {
    "slack": {
      "enabled": true,
      "mode": "socket",
      "botToken": "xoxb-...",
      "appToken": "xapp-...",
      "allowBots": false,
      "dm": { "enabled": true, "allowFrom": [] }
    }
  }
}
```

- `dm.enabled`: allow DMs to the bot.
- `dm.allowFrom`: restrict DMs to these user IDs; empty means allow all.
- `allowBots` (default `false`): whether bot-authored Slack messages can trigger replies.

### Feishu (Lark)

Create an app in the [Feishu open platform](https://open.feishu.com/), obtain App ID, App Secret, and (if using encryption) Encrypt Key and Verification Token.

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "YOUR_APP_ID",
      "appSecret": "YOUR_APP_SECRET",
      "encryptKey": "",
      "verificationToken": "",
      "allowFrom": []
    }
  }
}
```

### DingTalk

Create an app in the [DingTalk open platform](https://open.dingtalk.com/) and get Client ID and Client Secret.

```json
{
  "channels": {
    "dingtalk": {
      "enabled": true,
      "clientId": "YOUR_CLIENT_ID",
      "clientSecret": "YOUR_CLIENT_SECRET",
      "allowFrom": []
    }
  }
}
```

### WeCom (Enterprise WeChat)

Create an internal app in the [WeCom admin console](https://work.weixin.qq.com/), then collect:

- `corpId` (Enterprise ID)
- `agentId` (application Agent ID)
- `secret` (application secret)
- `token` (callback token)

Set the callback URL to `http://<your-host>:<callbackPort><callbackPath>` and keep callback mode in plaintext (the runtime currently skips encrypted callback payloads).

```json
{
  "channels": {
    "wecom": {
      "enabled": true,
      "corpId": "YOUR_CORP_ID",
      "agentId": "1000002",
      "secret": "YOUR_APP_SECRET",
      "token": "YOUR_CALLBACK_TOKEN",
      "callbackPort": 18890,
      "callbackPath": "/wecom/callback",
      "allowFrom": []
    }
  }
}
```

### WhatsApp

WhatsApp typically requires a bridge (e.g. a companion service). Configure the bridge URL and optional allowlist:

```json
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "bridgeUrl": "ws://localhost:3001",
      "allowFrom": []
    }
  }
}
```

Use `go-usb-ai channels login` when the bridge supports QR-based linking.

### Email

Configure IMAP (inbox) and SMTP (sending). The agent can read and reply to emails.

```json
{
  "channels": {
    "email": {
      "enabled": true,
      "consentGranted": true,
      "imapHost": "imap.example.com",
      "imapPort": 993,
      "imapUsername": "you@example.com",
      "imapPassword": "YOUR_PASSWORD",
      "imapMailbox": "INBOX",
      "imapUseSsl": true,
      "smtpHost": "smtp.example.com",
      "smtpPort": 587,
      "smtpUsername": "you@example.com",
      "smtpPassword": "YOUR_PASSWORD",
      "smtpUseTls": true,
      "fromAddress": "you@example.com",
      "autoReplyEnabled": true,
      "pollIntervalSeconds": 30,
      "allowFrom": []
    }
  }
}
```

Set `consentGranted` to `true` after you understand that the agent will read and send mail. Use `allowFrom` to restrict to certain sender addresses if desired.

### QQ

Use the QQ open platform app credentials.

```json
{
  "channels": {
    "qq": {
      "enabled": true,
      "appId": "YOUR_APP_ID",
      "secret": "YOUR_SECRET",
      "markdownSupport": false,
      "allowFrom": []
    }
  }
}
```

After changing channel config, GoUsbAi hot-reloads channel runtime automatically when the gateway is running.

---

## Tools

### Web search (Bocha default, Tavily and Brave optional)

Configure the active search provider under `search`. Bocha is the default and is recommended for mainland China users. Tavily is a good fit for research-heavy tasks when you want configurable retrieval depth and optional synthesized answers:

```json
{
  "search": {
    "provider": "tavily",
    "enabledProviders": ["bocha", "tavily"],
    "defaults": {
      "maxResults": 10
    },
    "providers": {
      "bocha": {
        "apiKey": "YOUR_BOCHA_KEY",
        "summary": true,
        "freshness": "noLimit"
      },
      "tavily": {
        "apiKey": "YOUR_TAVILY_KEY",
        "searchDepth": "advanced",
        "includeAnswer": true
      },
      "brave": {
        "apiKey": "YOUR_BRAVE_KEY"
      }
    }
  }
}
```

### Command execution (exec)

Allow the agent to run shell commands:

```json
{
  "tools": {
    "exec": { "timeout": 60 }
  },
  "restrictToWorkspace": false
}
```

- `timeout`: max seconds per command.
- `restrictToWorkspace`: if `true`, commands are restricted to the agent workspace directory; if `false`, the agent can run commands in other paths (use with care).

---

## Cron

### Cron

Schedule one-off or recurring tasks. The agent receives the message at the scheduled time.

List jobs:

```bash
go-usb-ai cron list
```

Add a one-time job (run at a specific time, ISO format):

```bash
go-usb-ai cron add -n "reminder" -m "Stand up and stretch" --at "2026-02-15T09:00:00"
```

Add a recurring job (cron expression):

```bash
go-usb-ai cron add -n "daily-summary" -m "Summarize yesterday" -c "0 9 * * *"
```

Add a job that runs every N seconds:

```bash
go-usb-ai cron add -n "ping" -m "Ping" -e 3600
```

Optional: run the job in a specific NCP session:

```bash
go-usb-ai cron add -n "follow-up" -m "Continue the existing work" -e 3600 --session <session-id>
```

Optional: deliver the agent’s reply to a channel:

```bash
go-usb-ai cron add -n "daily" -m "Daily briefing" -c "0 9 * * *" --deliver --to <recipient> --channel <channel>
```

List all jobs by default, or only enabled ones if needed:

```bash
go-usb-ai cron list
go-usb-ai cron list --enabled-only
```

Remove or change a job's enabled state:

```bash
go-usb-ai cron remove <jobId>
go-usb-ai cron enable <jobId>
go-usb-ai cron disable <jobId>
```

Run a job once (e.g. for testing):

```bash
go-usb-ai cron run <jobId>
```

### Session-Bound Follow-Up

If you want a scheduled task to continue an existing investigation or conversation, pass `--session <session-id>` when creating the job.

Example:

```bash
go-usb-ai cron add -n "follow-up" -m "Continue the existing work and report only meaningful changes" -e 1800 --session <session-id>
```

---

## UI (optional)

You can tune the UI server in config:

```json
{
  "ui": {
    "enabled": true,
    "host": "0.0.0.0",
    "port": 55667,
    "open": false
  }
}
```

- `enabled`: whether the UI server is started with the gateway (e.g. when using `go-usb-ai start`).
- `host` / `port`: bind address and port; `ui.host` is read-only in practice (CLI start paths always enforce `0.0.0.0`).
- `open`: open the default browser when the UI starts.

Default URL when using `go-usb-ai start`: **http://127.0.0.1:55667**.

GoUsbAi binds UI to `0.0.0.0` by default and attempts to detect/print a public IP-based URL at startup.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| **401 / invalid API key** | Verify the provider `apiKey` and `apiBase` in config or UI. Ensure no extra spaces or wrong key. |
| **Unknown model** | Confirm the model ID is supported by your provider (e.g. OpenRouter model list). |
| **No replies on a channel** | Ensure the channel is `enabled`, `allowFrom` includes your user ID if set, and the gateway is running (`go-usb-ai start` or `go-usb-ai gateway`). Run `go-usb-ai channels status` to see channel status. |
| **Port already in use** | Change `ui.port` in config or use `--ui-port` when starting. Default UI port is 55667, gateway 18790. |
| **Port connects but the UI never responds** | This usually means the target port is occupied by a stale or wrong listener instead of a healthy GoUsbAi HTTP server. Newer `go-usb-ai start` now preflights the UI port and fails fast with diagnostics. On the server, run `ss -ltnp | grep 55667` or `lsof -iTCP:55667 -sTCP:LISTEN -n -P`, then free the port or restart with `--ui-port <port>`. |
| **Public browser access returns 502** | First verify `curl http://127.0.0.1:55667/api/health` on the server. If it is `200`, your reverse proxy is misconfigured. Make sure it proxies to `http://127.0.0.1:55667` instead of `https://127.0.0.1:55667`, and that `443` is terminated by Nginx/Caddy rather than GoUsbAi itself. |
| **Config not loading** | Ensure `GOUSB_AI_HOME` (if set) points to the directory that contains `config.json`. Run `go-usb-ai status` to see which config file is used. |
| **Agent not responding in CLI** | Run `go-usb-ai init` if you have not yet; ensure a provider and model are set and the provider key is valid. |

---
