# v0.14.46-generic-mcp-delivery

## 迭代完成说明

本次完成通用 MCP 能力的一次性落地，重点包括：

- 在 `@go-usb-ai/core` 配置 schema 中新增通用 `mcp` 配置结构，支持 `stdio`、`http`、`sse` 三类 transport。
- 新增独立包 `@go-usb-ai/mcp`，承载 MCP config 归一化、client factory、server lifecycle、registry、doctor 等能力，避免将复杂性直接耦合进现有 runtime/CLI 主模块。
- 新增独立包 `@go-usb-ai/ncp-mcp`，把 MCP catalog 适配成 NCP tool，作为补充型工具源注入 native agent runtime。
- 为 `go-usb-ai` CLI 新增 `mcp add/list/remove/enable/disable/doctor` 命令。
- 完成 native NCP runtime 的 MCP 工具注入与预热接线。
- 修复 `mcp add` 在 commander 下的 `passThroughOptions` 启动报错。
- 修复 `mcp doctor` 命令打印结果后不退出的问题，确保 CLI 诊断命令可以自然结束。

相关方案文档：

- [通用 MCP 集成方案](../../plans/2026-03-19-generic-mcp-registry-plan.md)

## 测试/验证/验收方式

已执行验证：

- `pnpm install`
- `pnpm -C packages/go-usb-ai-core lint`
- `pnpm -C packages/go-usb-ai-core build`
- `pnpm -C packages/go-usb-ai-mcp lint`
- `pnpm -C packages/go-usb-ai-mcp tsc`
- `pnpm -C packages/go-usb-ai-mcp test`
- `pnpm -C packages/go-usb-ai-mcp build`
- `pnpm -C packages/ncp-packages/go-usb-ai-ncp-mcp lint`
- `pnpm -C packages/ncp-packages/go-usb-ai-ncp-mcp tsc`
- `pnpm -C packages/ncp-packages/go-usb-ai-ncp-mcp test`
- `pnpm -C packages/ncp-packages/go-usb-ai-ncp-mcp build`
- `pnpm -C packages/go-usb-ai lint`
- `pnpm -C packages/go-usb-ai tsc`
- `pnpm -C packages/go-usb-ai build`
- `pnpm dev start`
  - 验证点：开发态 backend/frontend 可正常启动，不再出现 `passThroughOptions cannot be used for 'add'` 异常
- 隔离目录冒烟：
  - `GOUSB_AI_HOME=<tmp> node packages/go-usb-ai/dist/cli/index.js mcp add demo -- <node> <mock-server> stdio`
  - `GOUSB_AI_HOME=<tmp> node packages/go-usb-ai/dist/cli/index.js mcp list --json`
  - `GOUSB_AI_HOME=<tmp> node packages/go-usb-ai/dist/cli/index.js mcp doctor demo --json`
  - 验证点：可写入配置、可列出 server、doctor 可发现 1 个 tool 且命令自然退出

待补充的后续增强（本次未做）：

- session 级可见性控制
- 更细粒度的启动策略（当前 `policy.start` 仅落 `eager` 语义）

## 发布/部署方式

本次为本地实现与验证完成，尚未执行正式发布。

如需发布，按现有 NPM/CLI 发布流程执行：

- 基于 changeset 生成版本变更
- 联动发布受影响的 workspace 包
- 发布后执行真实安装与 `go-usb-ai mcp` 命令冒烟

本次不适用：

- 远程 migration：未涉及后端数据库变更
- 线上 API 冒烟：未涉及服务端线上链路发布

## 用户/产品视角的验收步骤

1. 运行 `pnpm dev start`，确认开发环境可以正常启动。
2. 使用 `go-usb-ai mcp add chrome-devtools -- npx chrome-devtools-mcp@latest` 或等价 mock 命令添加一个 stdio MCP server。
3. 运行 `go-usb-ai mcp list`，确认能看到新 server，且默认 scope 不是 `all-agents`。
4. 运行 `go-usb-ai mcp doctor <name>`，确认能发现工具且命令会自行退出。
5. 进入 native NCP chat/runtime，确认 MCP tools 能作为补充工具源被发现并执行。
