# 迭代完成说明

本次迭代完成了 NCP Phase 2 的关键收口，重点不是继续做 legacy 适配，而是把 NCP 原生前后端链路真正贯通。

本次改动包括：

- 让 NCP request metadata 从前端发送入口一路贯通到 NCP runtime / context builder / LLM input，模型与 thinking 选择不再只停留在 UI 表面。
- 让 NCP session summary 带上 metadata，并在前端适配为共享展示层可理解的 `label`、`preferredModel`、`sessionType`、thinking 恢复信息。
- 让 `go-usb-ai` 的 NCP session store 持久化并保留这批 session-level metadata，保证刷新、重进会话后状态仍可恢复。
- 扩展 `@go-usb-ai/ncp-react` 的发送能力，支持直接发送原生 `NcpRequestEnvelope`，避免前端再次造一层伪 runtime。
- 收口 NCP Chat 页面发送失败时的 draft 恢复、会话重进时的 thinking hydration，以及新旧共享 UI 下的状态一致性。
- 补充 NCP session adapter 单测，锁住 metadata 到共享会话展示模型的适配行为。

相关方案文档：

- [NCP 并行链路切换方案](../../plans/2026-03-17-ncp-parallel-chain-cutover-plan.md)
- [ADR: Chat 前端链路切换点](../../designs/2026-03-17-chat-frontend-chain-switch-adr.md)

# 测试/验证/验收方式

已执行：

- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @go-usb-ai/ncp build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @go-usb-ai/ncp-toolkit build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @go-usb-ai/ncp-agent-runtime build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @go-usb-ai/ncp-react build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @go-usb-ai/ncp-toolkit tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter go-usb-ai tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @go-usb-ai/server tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @go-usb-ai/ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @go-usb-ai/ui build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @go-usb-ai/ui test -- src/components/chat/ncp/ncp-session-adapter.test.ts`

结果：

- NCP core/runtime/react/toolkit 的 build 通过。
- `go-usb-ai`、`@go-usb-ai/server`、`@go-usb-ai/ui` 的类型检查通过。
- `@go-usb-ai/ui` build 通过。
- 新增的 NCP session adapter 单测通过。

# 发布/部署方式

本次为开发阶段代码收口，不包含正式发布。

后续如需继续进入切换验证阶段，可按既有流程处理：

- 保持当前依赖已安装
- 启动包含 NCP agent 路由的 UI 服务端
- 使用前端切换点进入 `?chatChain=ncp` 做真实链路冒烟

本次不涉及远程 migration；数据库发布动作为不适用。

# 用户/产品视角的验收步骤

1. 启动 go-usb-ai UI 服务端，并确保 `/api/ncp/agent` 与 `/api/ncp/sessions` 可用。
2. 打开 chat 页面，使用 `?chatChain=ncp` 切到 NCP 链路。
3. 在新会话里选择模型、thinking，发送消息，确认回复正常产生。
4. 刷新页面后重新进入该会话，确认历史消息仍在，且模型 / thinking 的会话级恢复表现正常。
5. 当会话处于 running 状态时刷新并重进，确认会继续基于 NCP 原生流恢复。
6. 人为制造一次发送失败或断开场景，确认输入框 draft 不会丢失。
7. 删除当前 NCP 会话，确认页面回到新的 draft 会话，且 legacy 链路不受影响。
