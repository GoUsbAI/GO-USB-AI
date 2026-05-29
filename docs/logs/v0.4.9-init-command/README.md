# 2026-02-15 init 命令与启动自动初始化

## 背景 / 问题

- `onboard` 仅适用于一次性初始化，但用户期望 `start` 后即可就绪。

## 决策

- 新增 `go-usb-ai init` 命令用于初始化。
- `go-usb-ai start` 自动运行 init，并提示用户。
- `onboard` 保留但提示弃用。

## 变更内容

- 用户可见变化：
  - 新命令 `go-usb-ai init`。
  - `go-usb-ai start` 会自动补齐配置/模板（不覆盖已有文件）。
- 关键实现点：
  - 将初始化逻辑收敛到 `runtime.init`。
  - `start` 入口调用自动初始化。

## 验证（怎么确认符合预期）

```bash
# build / lint / typecheck
env PATH=/Users/peiwang/.nvm/versions/node/v22.16.0/bin:$PATH pnpm -C /Users/peiwang/Projects/nextbot build
env PATH=/Users/peiwang/.nvm/versions/node/v22.16.0/bin:$PATH pnpm -C /Users/peiwang/Projects/nextbot lint
env PATH=/Users/peiwang/.nvm/versions/node/v22.16.0/bin:$PATH pnpm -C /Users/peiwang/Projects/nextbot tsc

# smoke-check（非仓库目录）
cd /tmp
GOUSB_AI_HOME=/tmp/go-usb-ai-init-test /Users/peiwang/.nvm/versions/node/v22.16.0/bin/node /Users/peiwang/Projects/nextbot/packages/go-usb-ai/dist/cli/index.js init
test -f /tmp/go-usb-ai-init-test/workspace/AGENTS.md
```

验收点：

- `init` 生成 workspace 与模板文件。

## 发布 / 部署

- 本次为 CLI 变更，若发布 npm 包按 `docs/workflows/npm-release-process.md` 执行。

## 影响范围 / 风险

- Breaking change? 否
- 回滚方式：移除 `init` 命令并恢复 `start` 原逻辑。
