---
name: clawhub-go-usb-ai
description: Use when the user wants to search external ClawHub skills or install a ClawHub skill into a GoUsbAi workspace's skills directory without treating ClawHub as the GoUsbAi marketplace.
---

# ClawHub For GoUsbAi

## Overview

Use this skill when the user wants to use ClawHub as an external skill source for GoUsbAi.

This skill has one job:

- search ClawHub skills when needed,
- install a selected ClawHub skill into the intended GoUsbAi workspace's `skills/` directory,
- and keep the boundary explicit.

Do not blur the ecosystems:

- GoUsbAi marketplace is our own marketplace.
- ClawHub is an external upstream skill registry.
- This skill is only an external importer for GoUsbAi users.

Do not describe a ClawHub skill as a GoUsbAi marketplace skill unless it has separately been published to the GoUsbAi marketplace.

## Default Boundary

Default to the current GoUsbAi workspace as the install target.

If the workspace is ambiguous, clarify it before installing.
Do not silently install into a random repo or into OpenClaw's default `~/.openclaw/workspace`.

The safe path in this skill is to always drive ClawHub with an explicit GoUsbAi workspace:

```bash
clawhub --workdir <go-usb-ai-workspace> --dir skills install <skill-slug>
```

That pins ClawHub to `<workspace>/skills/<slug>`.

## Backend Choice

Prefer this order:

1. local `clawhub` command if already installed
2. `npm exec --yes clawhub -- ...`

Do not rely on raw `clawhub install <slug>` without an explicit workspace.

Why:

- ClawHub otherwise may fall back to an OpenClaw workspace such as `~/.openclaw/workspace`
- the user explicitly wants the skill installed into GoUsbAi's own `skills/` directory

## Workflow

### 1. Decide the goal

Classify the request into one of these:

- readiness check,
- search for possible skills,
- install a known skill,
- troubleshoot an existing imported ClawHub skill.

If the user does not know the exact slug, search first.

### 2. Confirm the target workspace

Default to the active GoUsbAi workspace.

Typical target:

- `<workspace>/skills/`

Use `--workdir <workspace> --dir skills` so the target is explicit.

### 3. Run readiness check

Use:

```bash
clawhub --workdir <go-usb-ai-workspace> --dir skills search "code review" --limit 1
```

Success means:

- the target workspace is clear,
- and a small real `search` request succeeds.

### 4. Search ClawHub

Use:

```bash
clawhub --workdir <go-usb-ai-workspace> --dir skills search "<keywords>"
```

Optional limit:

```bash
clawhub --workdir <go-usb-ai-workspace> --dir skills search "<keywords>" --limit 5
```

If the user is unsure, present the likely matches before installing.

### 5. Install into GoUsbAi

Use:

```bash
clawhub --workdir <go-usb-ai-workspace> --dir skills install <skill-slug>
```

If the upstream skill is flagged as suspicious and the user explicitly wants to proceed, rerun with:

```bash
clawhub --workdir <go-usb-ai-workspace> --dir skills install <skill-slug> --force
```

Do not add `--force` by default.

If `clawhub` is not installed, use the same command shape through npm:

```bash
npm exec --yes clawhub -- --workdir <go-usb-ai-workspace> --dir skills install <skill-slug>
```

### 6. Verify post-install result

After install, verify:

- `<workspace>/skills/<slug>/SKILL.md` exists
- ClawHub created `<workspace>/.clawhub/lock.json`
- the installed skill is now visible to GoUsbAi as a workspace skill

For local verification you can also use:

```bash
go-usb-ai skills installed --workdir <go-usb-ai-workspace>
go-usb-ai skills info <skill-slug> --workdir <go-usb-ai-workspace>
```

## Safe Execution Rules

- Keep calling ClawHub an external source, not our official marketplace.
- Search before install when the exact slug is uncertain.
- Always pin `--workdir <workspace> --dir skills`.
- Never silently install into the repo root unless the repo root is the intended GoUsbAi workspace.
- Do not use `--force` unless the user explicitly accepts the risk or the task is a deterministic overwrite request.
- If ClawHub backend resolution fails, stop and report the missing runtime instead of pretending the install succeeded.

## Troubleshooting

### ClawHub is not installed

Use:

```bash
npm exec --yes clawhub -- ...
```

If that also fails, report that Node/npm access is missing or blocked.

### Install went into `~/.openclaw/workspace`

That means ClawHub was run without an explicit GoUsbAi workspace.

Fix by rerunning with:

```bash
--workdir <go-usb-ai-workspace> --dir skills
```

### Skill is flagged as suspicious

ClawHub may block non-interactive install unless `--force` is provided.

Keep the warning visible.
Only continue with `--force` when the user explicitly wants that risk.

### Search or install fails

Check:

- network access,
- npm registry reachability if using `npm exec`,
- ClawHub registry reachability,
- and whether the slug really exists.

## Success Criteria

This skill is working correctly when:

- the user can search ClawHub from inside a GoUsbAi workflow,
- installation lands in the intended GoUsbAi workspace's `skills/` directory,
- the boundary between external ClawHub and GoUsbAi marketplace stays explicit,
- and install success is verified by real filesystem results instead of assumption.

## Resources

- ClawHub npm package:
  https://www.npmjs.com/package/clawhub
- ClawHub docs:
  https://docs.openclaw.ai/zh-CN/tools/clawhub
