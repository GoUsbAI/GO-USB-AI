# v0.0.1-feishu-session-memory-stability

## 迭代完成说明（改了什么）
- 修复飞书会话锚点不稳定问题：入站消息统一使用 `message.chat_id` 作为 `chatId` 进入运行时。
- 补齐飞书入站路由元数据，新增：
  - `is_group`
  - `peer_kind`
  - `peer_id`
  - `chat_id`
  - `sender_open_id` / `sender_user_id` / `sender_union_id`
- 兼容飞书事件包裹结构，支持从 `data.event` 读取 `sender/message`，降低事件结构差异导致的解析不一致风险。
- 变更文件：`packages/extensions/go-usb-ai-channel-runtime/src/channels/feishu.ts`

## 测试/验证/验收方式
- 静态与构建校验：
  - `pnpm build`
  - `pnpm lint`
  - `pnpm tsc`
- 冒烟验证（飞书入站会话路由）：
  - 执行命令（在 `/tmp`）：`node --input-type=module` 动态导入 `packages/extensions/go-usb-ai-channel-runtime/dist/index.js`，构造 DM + 群聊两条 `im.message.receive_v1` 事件调用 `FeishuChannel.handleIncoming(...)`。
  - 断言点：
    - DM：`chatId=oc_chat_dm_1`，`peer_kind=direct`，`peer_id=oc_chat_dm_1`
    - 群聊：`chatId=oc_chat_group_1`，`peer_kind=group`，`peer_id=oc_chat_group_1`
  - 结果：输出 `feishu smoke ok`，断言全部通过。

## 发布/部署方式
- 合并代码后执行常规发布流程：
  - 版本管理：按 changeset 流程升版
  - 发布：按项目 NPM 发布流程发布受影响包（至少 `@go-usb-ai/channel-runtime`，以及依赖联动包）
  - 重启运行实例：`go-usb-ai restart`
- 若仅本地验证：
  - 在开发环境构建并重启 gateway，确认飞书入站会话连续。

## 本次实际发布结果（2026-03-02）
- 执行命令：
  - `pnpm release:version`
  - `pnpm release:publish`
- 发布成功版本：
  - `go-usb-ai@0.8.58`
  - `@go-usb-ai/ui@0.5.44`
  - `@go-usb-ai/core@0.6.45`
  - `@go-usb-ai/channel-runtime@0.1.28`
  - `@go-usb-ai/openclaw-compat@0.1.34`
  - `@go-usb-ai/server@0.5.30`
  - `@go-usb-ai/channel-plugin-discord@0.1.7`
  - `@go-usb-ai/channel-plugin-dingtalk@0.1.6`
  - `@go-usb-ai/channel-plugin-email@0.1.6`
  - `@go-usb-ai/channel-plugin-feishu@0.1.6`
  - `@go-usb-ai/channel-plugin-mochat@0.1.6`
  - `@go-usb-ai/channel-plugin-qq@0.1.6`
  - `@go-usb-ai/channel-plugin-slack@0.1.6`
  - `@go-usb-ai/channel-plugin-telegram@0.1.6`
  - `@go-usb-ai/channel-plugin-wecom@0.1.6`
  - `@go-usb-ai/channel-plugin-whatsapp@0.1.6`
- 发布后验证：
  - 远端版本检查：`npm view go-usb-ai version`、`npm view @go-usb-ai/ui version`、`npm view @go-usb-ai/core version`、`npm view @go-usb-ai/channel-runtime version` 均返回新版本。
  - CLI 冒烟（非仓库目录）：在 `/tmp` 执行 `GOUSB_AI_HOME=$(mktemp -d ...) npx -y go-usb-ai@0.8.58 --version`，输出 `0.8.58`。
- 闭环动作适配说明：
  - 远程 migration：不适用（本次为 npm 包发布，无后端数据库迁移）。
  - 线上 API 冒烟：不适用（本次无独立线上后端部署动作）。

## 用户/产品视角的验收步骤
1. 在飞书同一会话（私聊或群聊）连续发送三条上下文相关消息（例如“我叫小王”→“你记住我叫什么了吗”→“再复述一次”）。
2. 在 `~/.go-usb-ai/sessions` 观察最新飞书会话文件，确认同一会话持续追加到同一个 `agent_main_feishu_*` 文件。
3. 验证模型可引用前两条信息，而不是只响应最后一条。
4. 群聊场景下，确认同一群会话不会被错误拆分为多个“按人分裂”的 session（可通过 session 文件数量与 key 观察）。
