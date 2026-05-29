# @go-usb-ai/desktop

Electron desktop shell for GoUsbAi.

## Scripts

- `pnpm -C apps/desktop dev`: build desktop main/preload and run Electron.
- `pnpm -C apps/desktop build`: build desktop runtime bundle (`dist/`).
- `pnpm -C apps/desktop dist`: build desktop artifacts with electron-builder.
- `pnpm -C apps/desktop smoke`: run non-GUI runtime smoke test.
- `pnpm -C apps/desktop bundle:public-key -- ...`: derive the bundled desktop update public key from the signing private key.
- `pnpm -C apps/desktop bundle:public-key:ensure`: guarantee `build/update-bundle-public.pem` exists before packaging. If no private key is present locally, it writes the currently published public key instead of leaving the packaged app without a verifier.
- `pnpm -C apps/desktop bundle:build -- ...`: build a launcher-compatible zipped product bundle.
- `pnpm -C apps/desktop bundle:manifest -- ...`: generate a signed desktop update manifest for a product bundle archive.
- `pnpm -C apps/desktop package:windows-portable -- --arch x64`: package a Windows Portable Edition zip from `release/win-unpacked`.

## Notes

- `build:main` uses `tsc` emit (no bundling). This avoids bundling Electron's runtime loader into `dist/src/main.js`.
- `dev` will auto-check `go-usb-ai/dist`. If missing, it auto-runs `pnpm -C packages/go-usb-ai build`, then injects `GOUSB_AI_DESKTOP_RUNTIME_SCRIPT=../../packages/go-usb-ai/dist/cli/index.js` explicitly.
- `pack` / `dist` will auto-ensure `go-usb-ai-ui` + `go-usb-ai` runtime artifacts before packaging.
- `pack` / `dist` now also auto-ensure `build/update-bundle-public.pem`. Do not bypass this by calling raw `electron-builder` unless you have already prepared the bundled update public key yourself.
- If you see `Electron failed to install correctly`, first run:
  - `PATH=/opt/homebrew/bin:$PATH pnpm install`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/desktop build`
  - then retry `PATH=/opt/homebrew/bin:$PATH pnpm dev:desktop`

## Release Modes

### Product Bundle Update Manifest

Build a zipped product bundle from the current `go-usb-ai` package output:

```bash
pnpm -C apps/desktop bundle:build -- \
  --channel stable \
  --platform linux \
  --arch x64 \
  --version 0.18.0 \
  --output-dir apps/desktop/dist-bundles
```

Normal desktop releases must resolve the minimum launcher version from
[`desktop-launcher-compatibility.json`](./desktop-launcher-compatibility.json).
Do not derive it from the current launcher package version.

`bundle:seed` is part of the same contract. Local packaging entrypoints may default
to `stable`, but release and validation workflows should pass the channel
explicitly so the packaged seed bundle and update manifest stay governed by the
same floor. The long-lived policy lives in
[`docs/internal/desktop-launcher-bundle-governance.md`](../../docs/internal/desktop-launcher-bundle-governance.md).

The builder currently:

- ensures `packages/go-usb-ai-ui` + `packages/go-usb-ai` outputs exist
- uses `pnpm --filter go-usb-ai --prod deploy` to create a self-contained runtime tree
- copies `ui-dist` into bundle `ui/`
- emits `bundle/manifest.json`
- writes `go-usb-ai-bundle-<platform>-<arch>-<version>.zip`

Generate a signed manifest for a zipped product bundle:

```bash
pnpm -C apps/desktop bundle:manifest -- \
  --bundle apps/desktop/dist-bundles/go-usb-ai-bundle-linux-x64-0.18.0.zip \
  --channel stable \
  --platform linux \
  --arch x64 \
  --version 0.18.0 \
  --bundle-url https://example.com/go-usb-ai-bundle-linux-x64-0.18.0.zip \
  --output apps/desktop/release-manifests/manifest-stable-linux-x64.json \
  --private-key-file /path/to/desktop-bundle-private.pem
```

Equivalent environment variables are also supported for signing:

- `GOUSB_AI_DESKTOP_BUNDLE_PRIVATE_KEY`
- `GOUSB_AI_DESKTOP_BUNDLE_PRIVATE_KEY_FILE`

The generated manifest now includes both:

- `bundleSignature`: signs the downloaded bundle archive
- `manifestSignature`: signs the manifest payload itself

Write the packaged launcher public key file from the same private key:

```bash
pnpm -C apps/desktop bundle:public-key -- \
  --private-key-file /path/to/desktop-bundle-private.pem \
  --output apps/desktop/build/update-bundle-public.pem
```

At runtime the launcher verifies bundle signatures with:

- `GOUSB_AI_DESKTOP_UPDATE_MANIFEST_URL` as an explicit override
- `GOUSB_AI_DESKTOP_BUNDLE_PUBLIC_KEY` as an explicit override
- packaged default manifest URL:
  - `https://github.com/Peiiii/go-usb-ai/releases/latest/download/manifest-stable-<platform>-<arch>.json`
- packaged default bundled public key:
  - `resources/update/update-bundle-public.pem`

The same public key is used to verify both the manifest signature and the bundle signature.

Desktop runtime sources are now intentionally reduced to only two:

- `bundle`: the packaged launcher runs the active product bundle
- `environment-override`: development or diagnostics can explicitly provide `GOUSB_AI_DESKTOP_RUNTIME_SCRIPT`

### 1) Validate before release

Run all checks from repo root:

- `PATH=/opt/homebrew/bin:$PATH pnpm desktop:package:verify`
- `PATH=/opt/homebrew/bin:$PATH pnpm build`
- `PATH=/opt/homebrew/bin:$PATH pnpm lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/desktop smoke`

Optional runtime smoke:

- `PATH=/opt/homebrew/bin:$PATH pnpm dev:desktop`

Expected startup logs include:

- `Channels enabled: ...`
- `UI API: http://0.0.0.0:<port>/api`
- `UI frontend: http://0.0.0.0:<port>`

`pnpm desktop:package:verify` is the required guardrail for GoUsbAi desktop release candidates. It now blocks packages that are missing `resources/update/update-bundle-public.pem` or cannot verify a published manifest signature.

### 2) Build desktop artifacts

macOS unsigned (current default in CI):

- `PATH=/opt/homebrew/bin:$PATH CSC_IDENTITY_AUTO_DISCOVERY=false pnpm -C apps/desktop dist -- --mac dmg zip --publish never`

macOS signed/notarized (optional):

- same command as above, but provide signing/notarization credentials in environment.

Windows (`Setup.exe` installer + unpacked EXE directory, no publish):

- `PATH=/opt/homebrew/bin:$PATH CSC_IDENTITY_AUTO_DISCOVERY=false pnpm -C apps/desktop exec electron-builder --win dir --x64 --publish never`
- `PATH=/opt/homebrew/bin:$PATH CSC_IDENTITY_AUTO_DISCOVERY=false pnpm -C apps/desktop exec electron-builder --win nsis --x64 --publish never`

Windows Portable Edition on Windows:

- `CSC_IDENTITY_AUTO_DISCOVERY=false pnpm -C apps/desktop exec electron-builder --win dir --x64 --publish never`
- `pnpm -C apps/desktop package:windows-portable -- --arch x64`
- `pnpm desktop:portable:verify`

The portable zip is rooted at `GoUsbAi-Portable/`. It detects portable mode through `go-usb-ai-portable.json`, creates `data/` on first launch, stores desktop state under `data/desktop`, runtime state under `data/runtime-home`, and logs under `data/logs`. Portable builds intentionally block in-app updates; users upgrade by downloading a newer portable zip and keeping or moving the `data/` directory.

Linux (`AppImage` + `.deb`, no publish):

- `PATH=/opt/homebrew/bin:$PATH CSC_IDENTITY_AUTO_DISCOVERY=false pnpm -C apps/desktop exec electron-builder --linux AppImage deb --x64 --publish never`

### 3) Artifacts to upload

All artifacts are under `apps/desktop/release`:

- `GoUsbAi Desktop-<version>-arm64.dmg`
- `GoUsbAi Desktop-<version>-arm64-mac.zip`
- `GoUsbAi Desktop-<version>-x64.dmg`
- `GoUsbAi Desktop-<version>-x64-mac.zip`
- `GoUsbAi.Desktop-Setup-<version>-x64.exe`
- `GoUsbAi-Portable-<version>-win-x64.zip`
- `GoUsbAi-Portable-<version>-win-arm64.zip`
- `latest.yml`
- `*.exe.blockmap`
- `win-unpacked/GoUsbAi Desktop.exe`
- `GoUsbAi.Desktop-<version>-linux-x64.AppImage`
- `go-usb-ai-desktop_<version>_amd64.deb`
- `../dist-bundles/go-usb-ai-bundle-<platform>-<arch>-<version>.zip`
- `../release-manifests/manifest-stable-<platform>-<arch>.json`
- `../build/update-bundle-public.pem`

Windows 推荐把 `Setup.exe` 作为普通安装入口，把 `GoUsbAi-Portable-<version>-win-<arch>.zip` 作为 U 盘/免安装入口；两者必须使用独立数据目录并可同时运行。

### 4) Linux package lifecycle

APT repository dry-run from repo root:

- `PATH=/opt/homebrew/bin:$PATH pnpm desktop:apt:build`
- `PATH=/opt/homebrew/bin:$PATH pnpm desktop:apt:verify`

Expected generated repository root:

- `dist/linux-apt-repo/apt`
- `dist/linux-apt-repo/apt/dists/stable/...`
- `dist/linux-apt-repo/apt/pool/main/n/go-usb-ai-desktop/...`

Recommended one-line installer:

```bash
curl -fsSL https://peiiii.github.io/go-usb-ai/install-apt.sh | bash
```

Manual install flow after GitHub Pages publish:

```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://peiiii.github.io/go-usb-ai/apt/go-usb-ai-archive-keyring.gpg \
  | sudo tee /etc/apt/keyrings/go-usb-ai-archive-keyring.gpg >/dev/null

echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/go-usb-ai-archive-keyring.gpg] https://peiiii.github.io/go-usb-ai/apt stable main" \
  | sudo tee /etc/apt/sources.list.d/go-usb-ai.list >/dev/null

sudo apt update
sudo apt install go-usb-ai-desktop
```

Expected upgrade / uninstall flow:

```bash
sudo apt update
sudo apt upgrade
sudo apt remove go-usb-ai-desktop
sudo apt purge go-usb-ai-desktop
```

### 5) Optional macOS signing credentials

- `CSC_LINK`, `CSC_KEY_PASSWORD` for Developer ID Application certificate.
- `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`, `APPLE_API_KEY` for notarization.
- If missing, release can still proceed in unsigned mode.
