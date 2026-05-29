# 2026-02-19 Release v0.6.15

## 发布目标

- 发布 Qwen(OpenRouter) 工具调用解析兼容增强，降低上游返回形态差异导致的工具调用异常风险。

## 发布范围

- `go-usb-ai@0.6.15`
- `@go-usb-ai/core@0.6.15`

未发布（版本未变更）：
- `@go-usb-ai/openclaw-compat@0.1.5`
- `@go-usb-ai/server@0.4.2`
- `@go-usb-ai/ui@0.3.9`

## 执行记录

```bash
pnpm release:version
pnpm release:publish
```

发布输出：
- `go-usb-ai@0.6.15` 发布成功
- `@go-usb-ai/core@0.6.15` 发布成功
- 自动生成 tag：`go-usb-ai@0.6.15`、`@go-usb-ai/core@0.6.15`

## 验证结果

- 发布前校验通过：`pnpm build && pnpm lint && pnpm tsc`（仅既有 warning，无新增 error）。
- npm 验收通过：
  - `npm view go-usb-ai version` → `0.6.15`
  - `npm view @go-usb-ai/core version` → `0.6.15`
- 发布后隔离冒烟通过（不写入仓库目录）：
  - `GOUSB_AI_HOME=/tmp/go-usb-ai-release-qwen-smoke-S5IUoc`
  - `npx -y go-usb-ai@0.6.15 agent -s cli:release-qwen-1 -m "请调用 list_dir 工具读取 /tmp，然后只回复 OK" --model openrouter/qwen/qwen3.5-plus-02-15`
  - 返回：`OK`

## 文档复盘

- 本次已同步：
  - `docs/logs/v0.6.16-qwen-tool-call-parser-hardening/README.md`
  - `docs/logs/v0.6.15-release-v0.6.15/README.md`
  - `docs/logs/README.md`
- 不涉及数据库/后端 migration（不适用）。
