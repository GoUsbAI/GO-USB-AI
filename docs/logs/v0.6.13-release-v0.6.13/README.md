# 2026-02-19 Release v0.6.13

## 发布目标

- 实现“重启后由 AI 主动回复完成”体验（非固定文案）。

## 发布范围

- `go-usb-ai@0.6.13`
- `@go-usb-ai/core@0.6.11`

未发布（版本未变更）：
- `@go-usb-ai/openclaw-compat@0.1.5`
- `@go-usb-ai/server@0.4.2`
- `@go-usb-ai/ui@0.3.9`

## 执行记录

```bash
pnpm release:version
pnpm release:publish
```

## 验证结果

- `build/lint/tsc` 通过（仅既有 warning）。
- `/tmp` 冒烟通过：
  - `pnpm -C packages/go-usb-ai exec tsx /tmp/go-usb-ai-restart-ai-wake-smoke.ts`
- 本机真实 Discord E2E 通过：
  - 重启后会话写入系统唤醒消息；
  - AI 生成并发出重启完成回复（非固定模板直发）。

## 文档复盘

- 本次已同步：
  - `docs/logs/v0.6.13-ai-generated-restart-reply/README.md`
  - `docs/logs/v0.6.13-release-v0.6.13/README.md`
  - 发布日志索引
- 不涉及数据库/后端 migration（不适用）。
