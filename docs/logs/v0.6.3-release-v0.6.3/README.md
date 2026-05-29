# 2026-02-19 Release v0.6.3

## 迭代完成说明

- 修复 OpenAI 兼容 provider 在 `wireApi=responses` 下的解析健壮性。
- 针对上游返回“合法 JSON + 尾部 event-stream 文本（如 `event: error`）”场景，避免 `response.json()` 直接抛错。
- 本次实际发布包：
  - `go-usb-ai@0.6.3`
  - `@go-usb-ai/core@0.6.3`

## 测试 / 验证 / 验收

### 发布前校验

```bash
pnpm release:check
```

结果：通过（存在仓库既有 lint warning：`max-lines` / `max-lines-per-function`，无新增错误）。

### 线上冒烟（VPS）

目标：`8.219.57.52`（root）

```bash
npm i -g go-usb-ai@0.6.3
go-usb-ai --version

go-usb-ai config set providers.openai.wireApi responses
go-usb-ai config set agents.defaults.model openai/gpt-5.2-codex

go-usb-ai agent -m "只回复OK"
```

观察点：

- `go-usb-ai --version` 输出 `0.6.3`
- 冒烟请求返回 `OK`
- 未再出现 `SyntaxError: Unexpected non-whitespace character after JSON`

### 发布后验收

```bash
npm view go-usb-ai version
npm view @go-usb-ai/core version
npm view go-usb-ai dist-tags --json
npm view @go-usb-ai/core dist-tags --json
```

结果：

- `go-usb-ai` 最新版本 `0.6.3`
- `@go-usb-ai/core` 最新版本 `0.6.3`
- `dist-tags.latest` 均为 `0.6.3`

## 发布 / 部署方式

- 已执行：
  1. `pnpm release:version`
  2. `pnpm release:publish`
- 自动创建 tag：
  - `go-usb-ai@0.6.3`
  - `@go-usb-ai/core@0.6.3`
- VPS 通过安装新版本修复：`npm i -g go-usb-ai@0.6.3`

## 发布后文档检查

- 已更新发布日志：`docs/logs/v0.6.3-release-v0.6.3/README.md`
- 本次为 runtime provider 解析修复，无新增用户配置项，`USAGE` 无需改动。
