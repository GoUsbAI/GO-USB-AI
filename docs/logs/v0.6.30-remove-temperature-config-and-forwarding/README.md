# 2026-02-19 v0.6.30-remove-temperature-config-and-forwarding

## 迭代完成说明

- 目标：移除 `temperature` 作为用户可配置项，并停止在运行时向模型请求透传该参数。
- 本次完成：
  - 配置层移除 `agents.defaults.temperature`：
    - `packages/go-usb-ai-core/src/config/schema.ts`
    - `packages/go-usb-ai-core/src/config/schema.help.ts`
    - `packages/go-usb-ai-core/src/config/schema.labels.ts`
    - `packages/go-usb-ai-core/src/config/reload.ts`
  - 运行时移除温度透传链路（主 agent + subagent + provider manager）：
    - `packages/go-usb-ai-core/src/agent/loop.ts`
    - `packages/go-usb-ai-core/src/agent/subagent.ts`
    - `packages/go-usb-ai-core/src/providers/base.ts`
    - `packages/go-usb-ai-core/src/providers/provider_manager.ts`
    - `packages/go-usb-ai/src/cli/runtime.ts`
    - `packages/go-usb-ai/src/cli/commands/service.ts`
  - Provider 请求体移除 `temperature` 字段透传：
    - `packages/go-usb-ai-core/src/providers/openai_provider.ts`
    - `packages/go-usb-ai-core/src/providers/litellm_provider.ts`
    - `packages/go-usb-ai-core/src/providers/registry.ts`
  - UI 与类型层同步移除温度字段与控件：
    - `packages/go-usb-ai-server/src/ui/types.ts`
    - `packages/go-usb-ai-ui/src/api/types.ts`
    - `packages/go-usb-ai-ui/src/components/config/ModelConfig.tsx`
    - `packages/go-usb-ai-ui/src/lib/i18n.ts`
  - 文档同步更新（移除 temperature 说明）：
    - `docs/USAGE.md`
    - `packages/go-usb-ai/templates/USAGE.md`
    - `docs/prd/current-feature-list.md`
    - `docs/prd/go-usb-ai-ui-prd.md`
    - `docs/go-usb-ai-ui-design-brief.md`
    - `docs/designs/2026-02-12-ui-gateway-api.md`

## 测试 / 验证 / 验收方式

### 构建与静态验证

```bash
pnpm build
pnpm lint
pnpm tsc
```

验收点：
- 全仓构建、lint、类型检查通过。
- `temperature` 相关类型/引用无残留报错。

### 冒烟验证（隔离目录）

```bash
TMP_HOME=$(mktemp -d /tmp/go-usb-ai-no-temperature.XXXXXX)
GOUSB_AI_HOME="$TMP_HOME" node packages/go-usb-ai/dist/cli/index.js config get agents.defaults --json
GOUSB_AI_HOME="$TMP_HOME" node packages/go-usb-ai/dist/cli/index.js channels status
rm -rf "$TMP_HOME"
```

验收点：
- `agents.defaults` 输出中不再包含 `temperature`。
- CLI 基本命令可正常运行。

## 发布 / 部署方式

执行流程：

```bash
pnpm release:version
pnpm release:publish
```

闭环说明：
- 远程 migration：不适用（无后端/数据库变更）。
- 服务部署：不适用（npm 包发布流程）。
- 线上 API 冒烟：不适用（无后端 API 发布）。
