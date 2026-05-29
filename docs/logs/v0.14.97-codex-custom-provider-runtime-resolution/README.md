# 迭代完成说明

- 新增 `@go-usb-ai/core` 统一能力 [`provider-runtime-resolution.ts`](/Users/tongwenwen/Projects/Peiiii/go-usb-ai/packages/go-usb-ai-core/src/config/provider-runtime-resolution.ts)，把“模型标识 -> provider/apiKey/apiBase/显示名/本地模型名”的解析收敛为单一入口。
- `go-usb-ai-ncp-runtime-plugin-codex-sdk` 改为复用 core 统一解析结果，不再把自定义 provider 的内部槽位名 `custom-*` 误传给 Codex SDK 的 `model_provider`。
- 新增 plugin 内部模块 [`codex-model-provider.ts`](/Users/tongwenwen/Projects/Peiiii/go-usb-ai/packages/extensions/go-usb-ai-ncp-runtime-plugin-codex-sdk/src/codex-model-provider.ts)，专门负责“外部 provider id”与用户可见模型路由的构造。
- `go-usb-ai-engine-plugin-codex-sdk` 也切到同一套 core provider 解析入口，避免 Codex 相关链路继续分叉。
- 新增回归测试：
  - [`provider-runtime-resolution.test.ts`](/Users/tongwenwen/Projects/Peiiii/go-usb-ai/packages/go-usb-ai-core/src/config/provider-runtime-resolution.test.ts)
  - [`codex-runtime-plugin-provider-routing.test.ts`](/Users/tongwenwen/Projects/Peiiii/go-usb-ai/packages/go-usb-ai/src/cli/commands/codex-runtime-plugin-provider-routing.test.ts)
- 更新 [`openclaw.plugin.json`](/Users/tongwenwen/Projects/Peiiii/go-usb-ai/packages/extensions/go-usb-ai-ncp-runtime-plugin-codex-sdk/openclaw.plugin.json)，补充 `modelProvider` 作为显式 override 配置项。

# 测试/验证/验收方式

- `pnpm -C packages/go-usb-ai-core test -- --run src/config/provider-runtime-resolution.test.ts src/config/schema.provider-routing.test.ts`
- `pnpm -C packages/go-usb-ai-core lint`
- `pnpm -C packages/go-usb-ai-core tsc`
- `pnpm -C packages/go-usb-ai-core build`
- `pnpm -C packages/extensions/go-usb-ai-ncp-runtime-plugin-codex-sdk build`
- `pnpm -C packages/extensions/go-usb-ai-ncp-runtime-plugin-codex-sdk lint`
- `pnpm -C packages/extensions/go-usb-ai-ncp-runtime-plugin-codex-sdk tsc`
- `pnpm -C packages/extensions/go-usb-ai-engine-plugin-codex-sdk lint && pnpm -C packages/extensions/go-usb-ai-engine-plugin-codex-sdk tsc`
- `pnpm -C packages/go-usb-ai test -- --run src/cli/commands/codex-runtime-plugin-provider-routing.test.ts`
- `pnpm -C packages/go-usb-ai lint`
- `pnpm -C packages/go-usb-ai tsc`
- 无写入冒烟：构造本地 config，注册 `codex` runtime，确认 runtime config 产出 `model=gpt-5.4`、`cliConfig.model_provider=yunyi`、`cliConfig.model_providers.yunyi.base_url=https://yunyi.example.com/v1`
- maintainability guard：
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/go-usb-ai-core/src/config/provider-runtime-resolution.ts packages/go-usb-ai-core/src/config/provider-runtime-resolution.test.ts packages/extensions/go-usb-ai-ncp-runtime-plugin-codex-sdk/src/index.ts packages/extensions/go-usb-ai-ncp-runtime-plugin-codex-sdk/src/codex-model-provider.ts packages/extensions/go-usb-ai-ncp-runtime-plugin-codex-sdk/openclaw.plugin.json packages/extensions/go-usb-ai-ncp-runtime-plugin-codex-sdk/tsup.config.ts packages/extensions/go-usb-ai-engine-plugin-codex-sdk/src/index.ts packages/go-usb-ai/src/cli/commands/codex-runtime-plugin-provider-routing.test.ts`
- 结果：
  - 无阻塞项
  - 警告 2 条：[`packages/extensions/go-usb-ai-engine-plugin-codex-sdk/src/index.ts`](/Users/tongwenwen/Projects/Peiiii/go-usb-ai/packages/extensions/go-usb-ai-engine-plugin-codex-sdk/src/index.ts) 仍在预算线外但本次未恶化；[`packages/extensions/go-usb-ai-ncp-runtime-plugin-codex-sdk/src/index.ts`](/Users/tongwenwen/Projects/Peiiii/go-usb-ai/packages/extensions/go-usb-ai-ncp-runtime-plugin-codex-sdk/src/index.ts) 接近预算线，后续可继续拆分。

# 发布/部署方式

- 本次未执行发布、部署、远程 migration。
- 若后续需要发布，先执行本 README 中列出的验证命令，再按项目既有 release 流程处理相关包版本与发布。

# 用户/产品视角的验收步骤

- 在本地 GoUsbAi 实例中创建一个自定义 provider，显示名设为 `yunyi`，`apiBase` 指向目标网关，模型列表包含 `gpt-5.4`。
- 新建 `codex` 会话并选择该自定义 provider 的模型。
- 发送消息，确认不再出现 `custom-1/gpt-5.4` 这类内部槽位名。
- 若需要查看运行时配置，确认 Codex SDK 接收到的 `model_provider` 为 `yunyi`，模型名为 `gpt-5.4`。
- 将同一模型切回 `native` 会话，确认 `native` 与 `codex` 对同一 provider 的解析结果保持一致。
