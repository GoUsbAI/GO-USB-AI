# 迭代完成说明

- 对上一轮飞书插件纠偏发布做依赖链补发：将 `@go-usb-ai/openclaw-compat` 再升一个 patch，并同步发布 `@go-usb-ai/server`、`@go-usb-ai/mcp`、`go-usb-ai`，确保入口包不再指向旧的 `@go-usb-ai/openclaw-compat@0.3.20`。
- 本轮不改动飞书插件实现本身，目标是修正“已发布包之间的版本连接关系”，让用户从 npm 安装 `go-usb-ai` 时真正拿到包含飞书纠偏的依赖链。

# 测试/验证/验收方式

- `npm view go-usb-ai@<new-version> dependencies --json`
- `npm view @go-usb-ai/server@<new-version> dependencies --json`
- `npm view @go-usb-ai/openclaw-compat@<new-version> version dist-tags --json`
- `GOUSB_AI_HOME=$(mktemp -d /tmp/go-usb-ai-feishu-registry-smoke-XXXXXX) pnpm dlx go-usb-ai@<new-version> plugins list --json`
- 观察点：
  - `go-usb-ai` 与 `@go-usb-ai/server` 的线上依赖都指向新的 `@go-usb-ai/openclaw-compat`
  - registry 安装态下 `feishu` 插件可正常 `loaded`

# 发布/部署方式

- 新建 patch changeset，覆盖：
  - `@go-usb-ai/openclaw-compat`
  - `@go-usb-ai/server`
  - `@go-usb-ai/mcp`
  - `go-usb-ai`
- 执行：
  - `pnpm release:version`
  - `NPM_CONFIG_USERCONFIG=/Users/peiwang/Projects/nextbot/.npmrc pnpm release:publish`

# 用户/产品视角的验收步骤

1. 安装新发布的 `go-usb-ai` patch 版本。
2. 检查 `go-usb-ai` 依赖清单，确认 `@go-usb-ai/openclaw-compat` 已升级到本轮新版本。
3. 运行 `go-usb-ai plugins list --json`，确认 `feishu` 插件依然是 `loaded`。
4. 在未配置飞书账号的默认环境下，确认只出现跳过日志，不出现 OpenClaw 依赖缺失错误。
