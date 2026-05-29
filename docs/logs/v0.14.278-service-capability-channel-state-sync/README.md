# 迭代完成说明

- 修复 `go-usb-ai serve` 的 deferred capability hydration 状态同步缺陷。
- 根因是服务启动时先用空 `pluginRegistry`/`extensionRegistry` 起壳，后台 hydration 只更新了 `runtimeState`，没有同步回 `gateway` 本体；而 `ConfigReloader`、`runtimePool` 闭包仍然读取 `gateway` 上那份旧的空状态，导致 `rebuildChannels()` 把渠道重建成空集合，最终出现 `Warning: No channels enabled`。
- 新增 `applyGatewayCapabilityState(...)`，在 `hydrateServiceCapabilities()` 和 `configureGatewayPluginRuntime()` 两条写路径里同时同步 `gateway` 与运行时状态，确保启动期和热重载期都使用同一份最新 capability state。
- 新增两条回归测试，分别覆盖：
  - hydration 期间在 `rebuildChannels()` 前必须先同步 `gateway` capability state
  - 插件热重载回调返回前必须先同步 `gateway` capability state
- 本机实际修复动作：
  - 将全局 `go-usb-ai` 从旧的 `0.16.12` 切到当前仓库构建出的 `0.16.13`
  - 备份原全局包目录到 `/Users/tongwenwen/.nvm/versions/node/v22.18.0/lib/node_modules/go-usb-ai.0.16.12.bak-20260329-1914`
  - 将 `/Users/tongwenwen/.nvm/versions/node/v22.18.0/lib/node_modules/go-usb-ai` 软链到当前仓库包目录 `packages/go-usb-ai`
  - 重启本机后台服务后，真实服务日志已从 `Warning: No channels enabled` 变为 `✓ Channels enabled: feishu, weixin`

# 测试/验证/验收方式

- 单元测试：
  - `pnpm --filter go-usb-ai test -- --run src/cli/commands/service-capability-hydration.test.ts src/cli/commands/service-gateway-bootstrap.test.ts`
- 类型检查：
  - `pnpm --filter go-usb-ai tsc`
- 受影响文件 lint：
  - `pnpm --filter go-usb-ai exec eslint src/cli/commands/service-gateway-context.ts src/cli/commands/service-capability-hydration.ts src/cli/commands/service-gateway-bootstrap.ts src/cli/commands/service-capability-hydration.test.ts src/cli/commands/service-gateway-bootstrap.test.ts`
- 构建：
  - `pnpm --filter go-usb-ai build`
- 隔离冒烟（非仓库目录写入）：
  - `GOUSB_AI_HOME=/tmp/go-usb-ai-debug-4wCvQF GOUSB_AI_STARTUP_TRACE=1 node packages/go-usb-ai/dist/cli/index.js serve --ui-port 18889`
  - 观察点：
    - deferred startup 后出现 `✓ Channels enabled: feishu, weixin`
    - `/tmp/go-usb-ai-debug-4wCvQF/channels/weixin/cursors/705b03f70348%40im.bot.json` 被写出
- 真实本机服务冒烟：
  - `go-usb-ai restart`
  - 观察点：
    - `/Users/tongwenwen/.go-usb-ai/logs/service.log` 出现 `✓ Channels enabled: feishu, weixin`
    - `/Users/tongwenwen/.go-usb-ai/channels/weixin/cursors/705b03f70348%40im.bot.json` 被写出

# 发布/部署方式

- 代码层：
  - `pnpm --filter go-usb-ai build`
- 本机即时生效：
  - 保留旧全局包备份
  - 将当前仓库 `packages/go-usb-ai` 软链到 nvm 全局目录 `/Users/tongwenwen/.nvm/versions/node/v22.18.0/lib/node_modules/go-usb-ai`
  - 执行 `go-usb-ai restart`
- 正式发布时：
  - 按项目既有 NPM 发布流程完成 linked runtime chain 的版本发布与更新

# 用户/产品视角的验收步骤

1. 执行 `go-usb-ai status`，确认后台服务在线且 UI/API 地址正常。
2. 执行 `tail -n 60 ~/.go-usb-ai/logs/service.log`，确认不再出现 `Warning: No channels enabled`，而是出现 `✓ Channels enabled: feishu, weixin`。
3. 执行 `find ~/.go-usb-ai/channels/weixin -maxdepth 3 -type f | sort`，确认存在 `cursors/705b03f70348%40im.bot.json`。
4. 再给微信机器人发一条新消息，观察机器人是否恢复回复。
5. 若需要回滚本机全局命令，删除当前软链并将备份目录 `go-usb-ai.0.16.12.bak-20260329-1914` 改回 `go-usb-ai`，然后执行 `go-usb-ai restart`。
