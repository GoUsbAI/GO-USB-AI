---
name: npm-release-contract-guard
description: Use when publishing GoUsbAi NPM packages or NPM runtime update channels, including beta/stable dist-tags, go-usb-ai@beta validation, runtime bundle manifests, packaged update public keys, and npm registry closure checks.
---

# NPM Release Contract Guard

## Overview
- Use this skill for GoUsbAi NPM package releases and NPM runtime update channel releases.
- Keep desktop release work in `desktop-release-contract-guard`; do not add another release orchestration layer.
- The goal is to prevent three mistakes:
  - treating an NPM package publish as complete before registry verification
  - publishing top-level `go-usb-ai` while leaving runtime workspace dependencies stale
  - shipping `go-usb-ai` without the packaged runtime update public key
  - treating an env-only runtime update test as a real user beta validation

## Scope
- `go-usb-ai` NPM package publishing, including beta and stable dist-tags.
- Workspace package release batches when they include NPM packages.
- NPM runtime update bundles under `npm-runtime-updates/<channel>`.
- User-facing validation of `go-usb-ai@beta` or stable NPM installs.
- Not desktop DMG/installer/update-manifest publishing.

## Primary Contracts
- Prefer the repo release flow; do not publish from package folders with raw `npm publish`.
- Before any publish attempt, verify npm auth with the same npm config source that the publish command will use. If publishing from a temp worktree or copied checkout, first check whether the project root has a private `.npmrc`; when it does, run publish with `NPM_CONFIG_USERCONFIG=<project-root>/.npmrc` instead of assuming the user-level npm login is the source of truth.
- A published `go-usb-ai` package must include `resources/update-bundle-public.pem`.
- The published package must include both launcher and app runtime entries:
  - `dist/cli/launcher/index.js`
  - `dist/cli/app/index.js`
- Do not treat `go-usb-ai` as a standalone CLI package. Its real installed behavior comes from the published dependency closure, especially runtime packages such as kernel, service, server, NCP packages, runtime adapters, and UI assets when applicable.
- If `go-usb-ai` depends on a workspace package whose local source changed meaningfully, or whose local version has not been published, that package must be versioned and published in the same batch before `go-usb-ai`.
- NPM runtime update manifests must use `hostKind: "npm-runtime-bundle"`.
- `minimumLauncherVersion` for NPM runtime bundles comes from `packages/go-usb-ai/npm-runtime-compatibility.json`.
- Do not raise `minimumLauncherVersion` unless the launcher-side contract really broke.

## Release Range Decision
Before deciding the package range, write down the release range and the reason. Do not infer it from the visible package name alone.

1. Identify whether users install through `go-usb-ai`, a runtime update channel, or a lower-level `@go-usb-ai/*` package.
2. If the release includes `go-usb-ai`, inspect `packages/go-usb-ai/package.json` runtime dependencies. Treat all `workspace:*` `@go-usb-ai/*` dependencies, plus any changed transitive runtime package they depend on, as the candidate release closure.
3. Run `pnpm release:report:health` and compare the output with the closure. Any dependency with meaningful unpublished drift must either be included in the release batch or explicitly proven irrelevant to the installed user path.
4. If the user says "全部发布", "直接发布", "完成全部", or reports a hard-to-debug installed-version mismatch, prefer the full public workspace batch through the repo release flow. Do not hand-pick only `go-usb-ai`.
5. A narrower-than-closure release is allowed only when all of these are true:
   - the user explicitly wants a narrow release,
   - every excluded workspace dependency is already published at the exact version referenced by the candidate package,
   - a packed or temporary install proves the installed dependency closure contains the required runtime APIs/assets,
   - the final answer names the intentionally excluded packages and why they are safe to exclude.

Never justify a single-package `go-usb-ai` release only because `packages/go-usb-ai` contains copied `ui-dist` or because `go-usb-ai --version` will show the new version. The UI version label, CLI version, and actual runtime behavior can diverge when kernel/service/NCP/UI dependency packages remain stale.

## Package Release Flow
0. Prefer the reusable beta owner when the request is specifically "发布 beta / 统一 beta 发版":
   - `pnpm release:beta`
   - `pnpm release:beta:npm`
   - `pnpm release:beta:runtime`
1. Sync and check package README content:
   - `pnpm release:sync-readmes`
   - `pnpm release:check-readmes`
2. Decide and prepare the release range:
   - for full public workspace release: `pnpm release:auto:changeset`
   - for a narrow release: create or inspect the changeset and document why the excluded dependency closure is safe
3. Prepare versions with the repo release flow:
   - `pnpm release:version`
4. For a release batch that includes `go-usb-ai`, make sure the packaged update public key exists before publish:
   - `GOUSB_AI_UPDATE_BUNDLE_PRIVATE_KEY=... pnpm -C packages/go-usb-ai runtime-update:build -- --channel beta --skip-build --output-dir tmp/npm-runtime-update-key-check`
   - Use `--channel stable` for stable releases.
5. Publish through the repo release flow:
   - `pnpm release:publish`
6. Verify the registry state:
   - `pnpm release:verify:published`
   - `npm view go-usb-ai dist-tags --json`

## Branch And Source Closure
- If publishing from a temporary worktree, release branch, detached HEAD, or any branch other than the user's current target branch, do not close after registry verification alone.
- Before the final answer, explicitly compare the target branch with the release branch and classify the remaining delta:
  - source code needed for the user-visible fix,
  - version / changelog / generated package artifacts,
  - historical release baseline commits,
  - unrelated changes.
- If user-facing source code is missing from the target branch, merge or cherry-pick it before saying the task is done, unless the user explicitly rejects that.
- If only release metadata or generated artifacts remain outside the target branch, say that plainly and name the exact follow-up: merge the release branch, cherry-pick the release commit, or intentionally leave release history separate.
- The final release notes must answer: "Is the target branch missing functional code?" and "Is the target branch missing published release records/artifacts?" Avoid wording that makes the user infer this from branch names or commit hashes.

## Beta Package Rule
- Prefer the repo changeset/pre-release flow for beta releases.
- Prefer `pnpm release:beta` for the full reusable closure when the batch may include `go-usb-ai`; by default this means one full public workspace beta batch, not a hand-picked subset.
- Prefer `pnpm release:beta:npm` only when the need is “publish beta packages now, do not yet open the runtime update channel”; it still inherits the full-public-batch expectation unless the user explicitly asks for a narrower scope.
- Prefer `pnpm release:beta:runtime` when `go-usb-ai@beta` is already published and the remaining work is only the runtime update channel.
- Use a hand-authored changeset or dedicated one-off flow for narrower scope only after telling the user the release is not a full public beta batch.
- If a single-package beta publish is unavoidable, use pnpm:
  - `pnpm -C packages/go-usb-ai publish --tag beta`
- After publish, verify the tag directly:
  - `npm view go-usb-ai@beta version`
  - `npm view go-usb-ai dist-tags --json`

## Pre-Publish Blocker Scan
Before publishing `go-usb-ai@beta`, run a blocker scan and resolve everything found:

- workspace dependency closure: compare `go-usb-ai` imports against changed workspace packages; any package providing a new runtime API must get its own beta version and dist-tag,
- for stable `go-usb-ai@latest`, prove any narrower-than-closure release with a packed install dependency check; otherwise use the affected public workspace batch,
- packed API check: install the exact packed or published dependency closure in a temp prefix and verify critical APIs exist, especially recently added methods,
- real install smoke: from a temp prefix, install `go-usb-ai@beta` or the candidate tarball and run at least `go-usb-ai --version` plus one minimal command path touching the changed runtime area,
- for stable `go-usb-ai@latest` publishes, the real install smoke must include `go-usb-ai update --check` from an isolated `GOUSB_AI_HOME` without `GOUSB_AI_UPDATE_BUNDLE_PUBLIC_KEY` or `GOUSB_AI_UPDATE_BUNDLE_PUBLIC_KEY_PATH`; this proves the packaged public key is discoverable by the published package,
- runtime update smoke: after channel publication, run check/download/apply/new-process from a temp `GOUSB_AI_HOME`.

For the published beta install smoke, prefer the repo command:

```bash
pnpm -C packages/go-usb-ai validation:npm-update -- --published-beta
```

If a scan item would be slow manually, create or improve a script instead of skipping it. The goal of the retrospective loop is to turn slow release surprises into one-command preflight checks.

## Retrospective Loop
After every NPM beta/stable release attempt, record the blockers that consumed time and convert at least one repeated blocker into a concrete mechanism:

- skill rule update,
- release preflight script,
- CI gate,
- smoke command,
- or explicit follow-up if the improvement is larger than the current release window.

Do not close a release attempt with only a narrative retrospective when the blocker can be cheaply automated or encoded as a release gate.

## Runtime Update Channel Flow
1. Trigger `.github/workflows/npm-runtime-update-release.yml` for the target channel.
   - Or use the reusable owner command: `pnpm release:beta:runtime`
2. Wait for the workflow conclusion to be `success`; dispatch alone is not a release.
3. Verify `gh-pages` contains the channel files:
   - `npm-runtime-updates/<channel>/manifest-<channel>-<platform>-<arch>.json`
   - `npm-runtime-updates/<channel>/go-usb-ai-runtime-<platform>-<arch>-<version>.zip`
   - `npm-runtime-updates/update-bundle-public.pem`
4. Verify the public GitHub Pages URL reflects the same manifest version.
5. Confirm the manifest has the expected `latestVersion`, `minimumLauncherVersion`, and `hostKind`.

## User-Facing Beta Validation
- Validate the exact published package, not a workspace link or local source build. Install or reinstall the published version first:

```bash
npm install -g go-usb-ai@beta
npm ls -g go-usb-ai --depth=0
go-usb-ai --version
```

- Confirm the running non-dev service uses the global npm package path, for example `.../lib/node_modules/go-usb-ai/dist/...`, not `.../Projects/nextbot/packages/go-usb-ai/dist/...`.
- Validate from an isolated home when testing update behavior so local development state is not involved:

```bash
export GOUSB_AI_HOME="$(mktemp -d)"
go-usb-ai update --channel beta --check
go-usb-ai update --channel beta
go-usb-ai update --apply
go-usb-ai --version
```

- Expected behavior:
  - `--check` detects the beta update without downloading.
  - `update --channel beta` downloads and verifies the runtime bundle.
  - `update --apply` switches the active runtime pointer.
  - the next `go-usb-ai` process runs the downloaded runtime version.

## Completion Gate
- The NPM registry shows the intended package version and dist-tag.
- The published `go-usb-ai` dependency closure contains the runtime APIs used by the `go-usb-ai` package.
- The runtime update workflow finished successfully.
- The public manifest URL shows the expected version and compatibility floor.
- A real `go-usb-ai@beta` or stable install can check, download, and apply without custom manifest URL or public key env vars.
- Final release notes must include:
  - NPM package version
  - dist-tag
  - workflow URL
  - public manifest URL
  - exact user-facing validation commands and result

## Forbidden Shortcuts
- Do not use raw `npm publish` as the default release path.
- Do not publish `go-usb-ai` without `resources/update-bundle-public.pem`.
- Do not claim release success after workflow dispatch only.
- Do not count an env-only `GOUSB_AI_UPDATE_MANIFEST_URL` test as user beta validation.
- Do not raise `minimumLauncherVersion` just because a new package version exists.
