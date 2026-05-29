# 2026-02-19 Release v0.6.10

## 发布目标

- 修复本地（Discord）实测场景下的“自重启后无回执”问题。
- 将重启回执发送收敛到统一 outbound 语义，减少特判，提升长期可维护性。

## 发布范围

- `go-usb-ai@0.6.10`
- `@go-usb-ai/core@0.6.9`

未发布（版本未变更）：
- `@go-usb-ai/openclaw-compat@0.1.5`
- `@go-usb-ai/server@0.4.2`
- `@go-usb-ai/ui@0.3.9`

## 执行记录

```bash
pnpm release:version
pnpm release:publish
```

`release:publish` 内已执行：
- `pnpm build`
- `pnpm lint`
- `pnpm tsc`
- `pnpm changeset publish`
- `pnpm changeset tag`

## 验证结果

- 本地校验通过：`build/lint/tsc`（仅仓库既有 warning，无新增 error）。
- `/tmp` 隔离冒烟通过：
  - `pnpm dlx tsx /tmp/go-usb-ai-restart-notify-smoke.ts`
  - `replyTo` 失败后可降级发送，不再静默丢失。
  - 持续失败会写入 `pending_system_events`。
- npm 发布成功：
  - `go-usb-ai@0.6.10`
  - `@go-usb-ai/core@0.6.9`
- npm 线上版本校验：
  - `npm view go-usb-ai version` -> `0.6.10`
  - `npm view @go-usb-ai/core version` -> `0.6.9`
- tag 创建成功：
  - `go-usb-ai@0.6.10`
  - `@go-usb-ai/core@0.6.9`

## 文档复盘

- 本次已同步：
  - `docs/logs/v0.6.9-restart-notify-delivery-align/README.md`
  - 发布日志索引
- 不涉及数据库/后端 migration（不适用）。
