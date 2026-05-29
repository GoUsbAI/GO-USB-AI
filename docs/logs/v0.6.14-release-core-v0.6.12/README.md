# 2026-02-19 Release core v0.6.12

## 发布目标

- 发布 `@go-usb-ai/core@0.6.12`，将系统提示词与 OpenClaw 基线对齐（保留 GoUsbAi 特有能力差异）。

## 发布范围

- 已发布：`@go-usb-ai/core@0.6.12`
- 未发布（版本已存在，无新增发布）：
  - `go-usb-ai@0.6.13`
  - `@go-usb-ai/openclaw-compat@0.1.5`
  - `@go-usb-ai/server@0.4.2`
  - `@go-usb-ai/ui@0.3.9`

## 执行记录

```bash
pnpm release:version
pnpm release:publish
```

`release:publish` 内执行：

- `pnpm build`
- `pnpm lint`
- `pnpm tsc`
- `pnpm changeset publish`
- `pnpm changeset tag`

## 发布结果

- npm 发布成功：`@go-usb-ai/core@0.6.12`
- tag 创建成功：`@go-usb-ai/core@0.6.12`
- 远端版本核验：`npm view @go-usb-ai/core version` 返回 `0.6.12`

## 验证结果

- `build/lint/tsc` 全通过（仅仓库既有 lint warning，无新增 error）。
- 对齐改动对应代码：`packages/go-usb-ai-core/src/agent/context.ts`。

## 文档复盘

- 已有实现日志：`docs/logs/v0.6.14-openclaw-system-prompt-parity/README.md`
- 本次新增发布日志：`docs/logs/v0.6.14-release-core-v0.6.12/README.md`
- 不涉及数据库/后端 migration（不适用）。
