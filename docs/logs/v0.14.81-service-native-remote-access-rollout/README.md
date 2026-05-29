# v0.14.81-service-native-remote-access-rollout

## 迭代完成说明

- 将 GoUsbAi remote access 的长期主路径收敛为 `go-usb-ai login -> go-usb-ai remote enable -> go-usb-ai start`，不再要求用户长期占住一个前台 `remote connect` 终端。
- 在共享配置模型中新增 `remote.enabled`、`remote.deviceName`、`remote.platformApiBase`、`remote.autoReconnect`，并补齐 labels / hints 与 schema 测试。
- 在 CLI 中新增 `go-usb-ai remote enable`、`go-usb-ai remote disable`、`go-usb-ai remote status`、`go-usb-ai remote doctor`；保留 `go-usb-ai remote connect` 作为前台 debug 模式。
- 将 remote connector 作为 `start/serve/stop/status` 生命周期内建模块接入，由 service host 统一托管，并把 remote 运行态写入统一 `service.json`。
- `go-usb-ai status` 现在会输出 remote 启用状态、连接状态、设备名、平台地址和最近错误；service log 中 websocket token 已做脱敏，不再输出原始 token。
- 设计与分阶段落地方案见：
  - [Service-Native Remote Access Design](../../../plans/2026-03-19-go-usb-ai-service-native-remote-design.md)
  - [Service-Native Remote Access Implementation Plan](../../../plans/2026-03-19-go-usb-ai-service-native-remote-implementation-plan.md)

## 测试/验证/验收方式

- 静态检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-core lint`
  - 结果：均通过；仅剩仓库历史 warning，无新增 error。
- 类型与测试：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-core test -- --run src/config/schema.remote.test.ts`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-core tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai tsc`
- 构建：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-core build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai build`
- service-native 真实冒烟（隔离 `GOUSB_AI_HOME`，不写仓库目录）：
  - 使用已登录的 `providers.go-usb-ai.apiKey` 派生临时配置
  - `node packages/go-usb-ai/dist/cli/index.js remote enable --name smoke-service-native --api-base https://ai-gateway-api.go-usb-ai.io/v1`
  - `node packages/go-usb-ai/dist/cli/index.js start --ui-port 18841 --start-timeout 60000`
  - `node packages/go-usb-ai/dist/cli/index.js remote status --json`
  - `node packages/go-usb-ai/dist/cli/index.js status --json`
  - `node packages/go-usb-ai/dist/cli/index.js remote doctor --json`
  - `node packages/go-usb-ai/dist/cli/index.js stop`
- 冒烟验收结果：
  - `remote status --json` 返回 `runtime.state = connected`
  - `status --json` 返回 `level = healthy` 且 `remote.runtime.state = connected`
  - `remote doctor --json` 的 `remote-enabled / platform-token / platform-api-base / local-ui / service-runtime` 五项检查全部为 `ok: true`
  - `logs/service.log` 中存在脱敏后的 websocket URL（示例形态 `token=nca.ey...EFG4`），且未发现原始 token

## 红区触达与减债记录

### packages/go-usb-ai/src/cli/commands/service.ts

- 本次是否减债：是
- 说明：将 remote module 创建逻辑、后台 service 初始状态写入、ready 状态回写抽到 [`service-remote-runtime.ts`](../../../../packages/go-usb-ai/src/cli/commands/service-remote-runtime.ts)，避免继续把 remote 生命周期直接堆进 `service.ts`。
- 下一步拆分缝：继续把 `startGateway` 中的 UI 启动编排、plugin gateway 启停、runtime pool 装配拆成独立 orchestration helpers。

### packages/go-usb-ai/src/cli/commands/diagnostics.ts

- 本次是否减债：是
- 说明：将 status/doctor 渲染外提到 [`diagnostics-render.ts`](../../../../packages/go-usb-ai/src/cli/commands/diagnostics-render.ts)，并把 provider 状态收集、issue/recommendation 汇总收敛为独立 helper，避免 remote 状态展示继续放大主 collector。
- 下一步拆分缝：把 `collectRuntimeStatus` 再拆成 endpoint snapshot、health probing、issue aggregation 三段独立 collector。

### packages/go-usb-ai/src/cli/runtime.ts

- 本次是否减债：是
- 说明：将 remote enable/disable/status/doctor/connect 的 CLI 门面收敛到 [`remote-runtime-actions.ts`](../../../../packages/go-usb-ai/src/cli/remote/remote-runtime-actions.ts)，停止继续在 `CliRuntime` 主类里直接扩写 remote 分支。
- 下一步拆分缝：继续把 platform auth、plugin、service 控制面按职责拆成更细的 runtime action façade。

## 发布/部署方式

- 按项目既有 NPM 发版流程执行：[NPM Package Release Process](../../../workflows/npm-release-process.md)
- 本轮发版闭环：
  - 创建 changeset：`.changeset/service-native-remote-access.md`
  - `PATH=/opt/homebrew/bin:$PATH NPM_CONFIG_USERCONFIG=/Users/peiwang/Projects/nextbot/.npmrc pnpm release:version`
  - `PATH=/opt/homebrew/bin:$PATH NPM_CONFIG_USERCONFIG=/Users/peiwang/Projects/nextbot/.npmrc pnpm release:publish`
- 发布后校验：
  - `PATH=/opt/homebrew/bin:$PATH npm view go-usb-ai version`
  - `PATH=/opt/homebrew/bin:$PATH npm view @go-usb-ai/core version`
  - 使用已发布版本再次执行 `go-usb-ai remote --help`、`go-usb-ai remote enable --help`、`go-usb-ai remote status --help` 做安装态命令面校验

## 用户/产品视角的验收步骤

1. 在本机执行 `go-usb-ai login --api-base https://ai-gateway-api.go-usb-ai.io/v1`。
2. 执行 `go-usb-ai remote enable --name <你的设备名>`。
3. 执行 `go-usb-ai start`，不需要再额外开一个终端挂着 `remote connect`。
4. 执行 `go-usb-ai remote status`，确认看到 `Enabled: yes` 且 `State: connected`。
5. 执行 `go-usb-ai status`，确认总状态里能看到 remote 已启用并已连接。
6. 在 GoUsbAi Platform 的设备页打开该设备，确认可从另一台电脑进入本机 GoUsbAi。
7. 如遇问题，先执行 `go-usb-ai remote doctor`；只有在排障场景下才使用 `go-usb-ai remote connect` 前台调试。
