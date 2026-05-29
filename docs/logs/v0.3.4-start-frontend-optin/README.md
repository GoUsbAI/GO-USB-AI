# 2026-02-12 start: frontend dev server opt-in

## 背景 / 问题

- `go-usb-ai start` 默认启动前端 dev server 会占用 5173，可能与用户本地应用冲突

## 决策

- 前端 dev server 改为显式 `--frontend` 才启动
- 默认优先使用内置静态 UI

## 变更内容

- 调整 `go-usb-ai start` 参数与启动逻辑
- 文档更新（README / USAGE）

## 验证（怎么确认符合预期）

```bash
pnpm -C /Users/peiwang/Projects/nextbot build
pnpm -C /Users/peiwang/Projects/nextbot lint
pnpm -C /Users/peiwang/Projects/nextbot tsc

# smoke-check（非仓库目录）
GOUSB_AI_HOME=/tmp/go-usb-ai-start-smoke pnpm -C /Users/peiwang/Projects/nextbot/packages/go-usb-ai dev start --no-open --ui-port 18809 &
sleep 2
curl -s http://127.0.0.1:18809/api/health
pkill -f "go-usb-ai.*start" || true
```

验收点：

- build/lint/tsc 全部通过
- `/api/health` 返回 ok

## 发布 / 部署

- 本次未发布

## 影响范围 / 风险

- Breaking change：轻微（start 默认不再启动 dev server）
- 风险：开发态需要显式 `--frontend`
