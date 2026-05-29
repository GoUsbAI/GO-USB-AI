# 2026-02-23 go-usb-ai 0.8.6 UI Dist Sync

## 背景 / 问题

- `go-usb-ai` 打包的 UI 需要与最新 `@go-usb-ai/ui` 版本一致。

## 决策

- 仅升级 `go-usb-ai` patch 版本，刷新内置 `ui-dist`。

## 变更内容

- 发布 `go-usb-ai@0.8.6`（同步 UI dist）。

## 验证（怎么确认符合预期）

```bash
# release:publish 内含 release:check（build/lint/tsc）
pnpm release:publish

# smoke-check（非仓库目录）
GOUSB_AI_HOME=/tmp/go-usb-ai-ui-release-smoke pnpm -C /Users/peiwang/Projects/nextbot/packages/go-usb-ai dev start --ui-port 18813 > /tmp/go-usb-ai-ui-release-smoke.log 2>&1
sleep 2
curl -s http://127.0.0.1:18813/api/health
GOUSB_AI_HOME=/tmp/go-usb-ai-ui-release-smoke pnpm -C /Users/peiwang/Projects/nextbot/packages/go-usb-ai dev stop
```

验收点：

- `release:publish` 内置校验通过（build/lint/tsc）。
- `/api/health` 返回 `ok`。

## 发布 / 部署

按 [`docs/workflows/npm-release-process.md`](../../../docs/workflows/npm-release-process.md) 执行：

```bash
pnpm release:version
pnpm release:publish
```

## 用户 / 产品验收步骤

- 启动 `go-usb-ai` UI（或集成环境），进入 Marketplace 列表页，Tooltip 正常显示且不被遮挡。

## 影响范围 / 风险

- Breaking change：否
- 风险：低（版本与 UI dist 同步）
