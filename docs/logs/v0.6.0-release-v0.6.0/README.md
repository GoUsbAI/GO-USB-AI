# 2026-02-18 Release v0.6.0

## 迭代完成说明

- 按项目发布流程执行 `changeset -> version -> publish -> tag`。
- 本次实际发布包：
  - `go-usb-ai@0.6.0`
  - `@go-usb-ai/core@0.6.0`
  - `@go-usb-ai/server@0.4.0`
- 未发布包：
  - `@go-usb-ai/ui@0.3.8`（npm 已存在同版本，changeset 自动跳过）
- 发布内容覆盖：
  - 移除 OpenClaw plugin 兼容系统（CLI/运行时/配置链路）。
  - UI 配置 API 返回脱敏（不再返回 `token/secret/password/apiKey` 与授权类 header）。

## 测试 / 验证 / 验收

### 发布前校验

```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
pnpm release:check
```

结果：通过（仅仓库既有 lint warning：`packages/go-usb-ai-core/src/channels/mochat.ts` 行数告警）。

### 冒烟测试（隔离目录）

```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
TMP_HOME=$(mktemp -d /tmp/go-usb-ai-release-smoke.XXXXXX)

GOUSB_AI_HOME="$TMP_HOME" node packages/go-usb-ai/dist/cli/index.js --help
GOUSB_AI_HOME="$TMP_HOME" node packages/go-usb-ai/dist/cli/index.js channels --help
GOUSB_AI_HOME="$TMP_HOME" node packages/go-usb-ai/dist/cli/index.js plugins --help

# API 脱敏冒烟（临时配置文件）
node --input-type=module <<'EOF'
// 通过 buildConfigView / updateChannel 验证敏感字段不再回传
EOF

rm -rf "$TMP_HOME"
```

观察点：

- `channels --help` 仅保留 `status/login`。
- `plugins --help` 不再出现插件命令组。
- API 脱敏冒烟输出 `API_SMOKE_OK`。

### 发布后验收

```bash
npm view go-usb-ai@0.6.0 version
npm view @go-usb-ai/core@0.6.0 version
npm view @go-usb-ai/server@0.4.0 version

npm view go-usb-ai dist-tags --json
npm view @go-usb-ai/core dist-tags --json
npm view @go-usb-ai/server dist-tags --json
```

结果：

- 版本可查：`0.6.0 / 0.6.0 / 0.4.0`。
- `dist-tags.latest` 分别为：`go-usb-ai=0.6.0`、`@go-usb-ai/core=0.6.0`、`@go-usb-ai/server=0.4.0`。

## 发布 / 部署方式

- 已执行：
  1. `pnpm release:version`
  2. `pnpm release:publish`
- 自动创建 tag：
  - `go-usb-ai@0.6.0`
  - `@go-usb-ai/core@0.6.0`
  - `@go-usb-ai/server@0.4.0`
- 本次仅 NPM 包发布：
  - 远程 migration：不适用（无数据库变更）
  - 服务部署：不适用（无线上服务部署动作）

## 发布后文档检查

- 已完成文档影响检查：
  - `README.md`
  - `docs/USAGE.md`
  - `docs/prd/current-feature-list.md`
  - `docs/prd/current-feature-overview.md`
- 结论：本次功能/命令变更对应文档已同步在本次改动中，无需额外补充。

