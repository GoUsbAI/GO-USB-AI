# v0.14.78-go-usb-ai-remote-packaging-repair

## 迭代完成说明

- 修复 `go-usb-ai remote connect` 在最新全局安装中报 `unknown command 'remote'` 的问题，确认根因是用户命中的 `go-usb-ai@0.13.1` 缺少 `remote` 命令。
- 继续定位到 `go-usb-ai@0.13.2` 发布链问题：`@go-usb-ai/core`、`@go-usb-ai/runtime`、`@go-usb-ai/channel-runtime`、`@go-usb-ai/openclaw-compat` 等 tarball 缺少 `dist`，导致全局安装后 CLI 启动失败。
- 将所有公开且有 `build` 脚本的 npm 包统一补上 `prepack: pnpm run build`，让 `pack/publish` 时自动构建当前包，避免再出现 tarball 漏产物。
- 同步把已发布但尚未回写主仓库的版本号与 changelog 回灌到仓库，并完成新一轮修复发布：
  - `go-usb-ai@0.13.3`
  - `@go-usb-ai/server@0.10.3`
  - `@go-usb-ai/core@0.9.4`
  - `@go-usb-ai/runtime@0.2.4`
  - `@go-usb-ai/channel-runtime@0.2.4`
  - `@go-usb-ai/openclaw-compat@0.3.7`
  - 以及联动缺失的 `channel-plugin-*`、`@go-usb-ai/mcp@0.1.3`、`@go-usb-ai/ncp-mcp@0.1.3`、`@go-usb-ai/go-usb-ai-ncp-runtime-plugin-*`

## 测试/验证/验收方式

- 构建验证：
  - `pnpm -C packages/go-usb-ai-core build`
  - `pnpm -C packages/extensions/go-usb-ai-channel-runtime build`
  - `pnpm -C packages/go-usb-ai-runtime build`
  - `pnpm -C packages/go-usb-ai-openclaw-compat build`
  - `pnpm -C packages/go-usb-ai-server build`
  - `pnpm -C packages/go-usb-ai build`
- 类型与 lint：
  - `pnpm -C packages/go-usb-ai-core tsc && pnpm -C packages/go-usb-ai-core lint`
  - `pnpm -C packages/extensions/go-usb-ai-channel-runtime tsc && pnpm -C packages/extensions/go-usb-ai-channel-runtime lint`
  - `pnpm -C packages/go-usb-ai-runtime tsc && pnpm -C packages/go-usb-ai-runtime lint`
  - `pnpm -C packages/go-usb-ai-openclaw-compat tsc && pnpm -C packages/go-usb-ai-openclaw-compat lint`
  - `pnpm -C packages/go-usb-ai-server tsc && pnpm -C packages/go-usb-ai-server lint`
  - `pnpm -C packages/go-usb-ai tsc && pnpm -C packages/go-usb-ai lint`
- tarball 验证：
  - `pnpm -C packages/go-usb-ai-runtime pack --pack-destination /tmp/...`
  - `pnpm -C packages/go-usb-ai pack --pack-destination /tmp/...`
  - `pnpm -C packages/extensions/go-usb-ai-channel-runtime pack --pack-destination /tmp/...`
  - `pnpm -C packages/go-usb-ai-openclaw-compat pack --pack-destination /tmp/...`
  - `pnpm -C packages/go-usb-ai-core pack --pack-destination /tmp/...`
  - `pnpm -C packages/go-usb-ai-server pack --pack-destination /tmp/...`
  - 验证点：日志中出现当前包的 `prepack -> pnpm run build`，并且 tarball 内包含 `package/dist/*`
- CLI 冒烟：
  - `node packages/go-usb-ai/dist/cli/index.js remote --help`
  - `go-usb-ai --version`
  - `go-usb-ai remote --help`
  - `go-usb-ai remote connect --help`
  - `go-usb-ai status`
  - `go-usb-ai remote connect --once`
  - 验证点：真实连上 `https://ai-gateway-api.go-usb-ai.io`，成功注册 remote device，并建立 websocket 连接。
- 可维护性检查：
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths ...`
  - 结果：本次改动主要为 `package.json` / `CHANGELOG.md` / 发布元数据，守卫返回 `not applicable`

## 发布/部署方式

- 版本整理：
  - `pnpm changeset version`
- npm 发布：
  - `NPM_CONFIG_USERCONFIG=/Users/peiwang/Projects/nextbot/.npmrc pnpm changeset publish`
- 发布后校验：
  - `npm view go-usb-ai version`
  - `npm view @go-usb-ai/server version`
  - `npm view @go-usb-ai/core version`
  - `npm view @go-usb-ai/runtime version`
- 本机升级：
  - `npm i -g go-usb-ai@0.13.3`

## 用户/产品视角的验收步骤

1. 在本机执行 `go-usb-ai --version`，应显示 `0.13.3`。
2. 执行 `go-usb-ai remote --help`，应能看到 `connect` 子命令，不再出现 `unknown command 'remote'`。
3. 执行 `go-usb-ai status`，确认本地 GoUsbAi 服务处于 `healthy`。
4. 执行 `go-usb-ai remote connect --once`。
5. 在输出中确认以下结果：
   - remote device 成功注册
   - local origin 为本地 UI 地址
   - platform 为 `https://ai-gateway-api.go-usb-ai.io`
   - remote connector 成功建立 websocket 连接
