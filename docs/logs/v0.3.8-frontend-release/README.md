# 2026-02-12 Frontend refresh release

## 背景 / 问题

- 前端已有更新，需要重新发布 npm 包

## 决策

- 按标准 changeset 流程发布 `go-usb-ai` 与 `@go-usb-ai/ui`

## 变更内容

- 发布 `go-usb-ai@0.2.4`
- 发布 `@go-usb-ai/ui@0.2.3`

## 验证（怎么确认符合预期）

```bash
pnpm -C /Users/peiwang/Projects/nextbot release:check

# smoke-check（非仓库目录）
GOUSB_AI_HOME=/tmp/go-usb-ai-ui-release-smoke pnpm -C /Users/peiwang/Projects/nextbot/packages/go-usb-ai dev start --ui-port 18813 > /tmp/go-usb-ai-ui-release-smoke.log 2>&1
sleep 2
curl -s http://127.0.0.1:18813/api/health
GOUSB_AI_HOME=/tmp/go-usb-ai-ui-release-smoke pnpm -C /Users/peiwang/Projects/nextbot/packages/go-usb-ai dev stop
```

验收点：

- build/lint/tsc 全部通过
- `/api/health` 返回 ok

## 发布 / 部署

```bash
pnpm -C /Users/peiwang/Projects/nextbot release:version
pnpm -C /Users/peiwang/Projects/nextbot release:publish
```

线上验证：

```bash
npm view go-usb-ai@0.2.4 version
npm view @go-usb-ai/ui@0.2.3 version
```

## 影响范围 / 风险

- Breaking change：否
- 风险：无
