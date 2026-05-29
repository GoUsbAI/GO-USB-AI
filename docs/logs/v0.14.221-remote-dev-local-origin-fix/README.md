# v0.14.221 Remote Dev Local Origin Fix

## 迭代完成说明

- 修复开发模式下 remote access 从实例列表点击打开后落到 `not found` 的问题。
- 根因是 `pnpm dev start` 会把 backend UI 服务跑在 `18792`，同时通过 `GOUSB_AI_DISABLE_STATIC_UI=1` 关闭本地静态 UI；remote connector 之前仍把远程访问回源目标当成 `http://127.0.0.1:<backend-ui-port>`，导致远端打开 `/` 时被转发到一个没有页面壳的本地入口。
- 本次改动让 `packages/go-usb-ai/src/cli/commands/service-remote-runtime.ts` 支持显式 `localOriginOverride`，并兼容读取 `GOUSB_AI_REMOTE_LOCAL_ORIGIN`。
- `scripts/dev-runner.mjs` 在开发模式下启动 backend 时，显式注入 `GOUSB_AI_REMOTE_LOCAL_ORIGIN=http://127.0.0.1:<frontend-port>`，因此 remote connector 会把远程访问流量回源到 Vite 前端入口，而不是回到只提供 API 的 backend 根路径。
- 为该行为补充了 `packages/go-usb-ai/src/cli/commands/service-remote-runtime.test.ts` 单测，覆盖 override 会优先于默认 UI host/port 推导。

## 测试/验证/验收方式

- 单元测试：
  - `pnpm -C packages/go-usb-ai test -- service-remote-runtime.test.ts`
  - 结果：通过。
- 隔离开发态冒烟：
  - 使用临时目录作为 `GOUSB_AI_HOME`，并通过自定义端口启动隔离 dev 实例：
  - `GOUSB_AI_HOME=/tmp/go-usb-ai-remote-dev-smoke.<id> GOUSB_AI_DEV_BACKEND_PORT=18892 GOUSB_AI_DEV_FRONTEND_PORT=5274 pnpm dev start`
  - 访问 `http://127.0.0.1:18892/api/remote/status`
  - 结果：`data.localOrigin` 与 `data.runtime.localOrigin` 都为 `http://127.0.0.1:5274`，证明 remote runtime 已回源到前端入口而不是 backend 根路径。
- 可维护性闸门：
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths scripts/dev-runner.mjs packages/go-usb-ai/src/cli/commands/service-remote-runtime.ts packages/go-usb-ai/src/cli/commands/service-remote-runtime.test.ts`
  - 结果：通过，无新增 maintainability findings。
- 类型检查补充说明：
  - `pnpm -C packages/go-usb-ai tsc`
  - 结果：未通过，但失败点是仓库现有无关错误：`packages/go-usb-ai-server/src/ui/router/ncp-attachment.controller.ts` 中 `FormDataEntryValue` 未定义；本次未修改该文件。

## 发布/部署方式

- 本次为开发态 remote access 修复，代码合入后按正常 NPM/CLI 发布链路发布包含 `packages/go-usb-ai` 的版本即可。
- 若仅本地验证，不需要单独部署 platform worker 或 platform console。
- 若要让其他开发者立即获得修复，需在后续正式发布中包含：
  - `packages/go-usb-ai`
  - 使用该 dev runner 的仓库源码分发

## 用户/产品视角的验收步骤

1. 在本地仓库执行 `pnpm dev start`。
2. 在本地 GoUsbAi UI 中登录平台账号并开启 remote access，让该开发实例出现在平台实例列表中。
3. 打开平台实例列表，点击该实例的“在网页中打开”。
4. 期望结果：
   - 不再出现 `not found`。
   - 远程页面能正常进入 GoUsbAi UI，而不是落到 backend 根路径的 404。
5. 如需进一步确认，可在本地打开 `http://127.0.0.1:<backend-port>/api/remote/status`，检查返回里的 `localOrigin` 是否为 Vite 前端端口。
