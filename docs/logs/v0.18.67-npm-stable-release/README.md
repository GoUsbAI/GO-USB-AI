# v0.18.67 NPM Stable Release

## 迭代完成说明

完成一次正式 NPM stable 发布批次。发布前通过仓库 release check，发布过程中 `@go-usb-ai/channel-extension-feishu@0.1.1` 曾出现 npm packument 短暂 404，但 access 与 dist-tag 已存在；等待 registry 收敛后恢复，并完成安装验收。

## 测试/验证/验收方式

- `pnpm release:check`：正式批次 build/tsc 通过。
- `pnpm release:verify:published`：确认 50/50 个包版本已发布。
- `npm view go-usb-ai dist-tags --json`：确认 `latest` 指向 `0.19.7`。
- `npm install --prefix <tmp> go-usb-ai@latest`：隔离安装通过。
- `<tmp>/node_modules/.bin/go-usb-ai --version`：输出 `0.19.7`。
- `GOUSB_AI_HOME=<tmp-home> <tmp>/node_modules/.bin/go-usb-ai update --check`：确认 runtime `0.19.7` 已是最新。

## 发布/部署方式

通过仓库 NPM release 流程发布：

- `pnpm release:auto`：生成 changeset 并执行版本 bump，首次在 `changeset version` 因本机内存压力被 kill，随后以受控方式续跑成功。
- `pnpm release:publish`：执行 README 检查、release check、changeset publish、registry verification；第一次 verification 等待新包 registry 收敛超时，收敛后补跑验证成功。

本次不涉及后端数据库 migration、线上 API deploy 或桌面安装包发布。

## 用户/产品视角的验收步骤

用户现在通过 `npm install -g go-usb-ai@latest` 获取 `go-usb-ai@0.19.7`。隔离安装已验证 CLI 可运行，并且 stable runtime update check 能从已发布包中读取更新公钥与运行时信息。

## 可维护性总结汇总

本次为发布版本与构建产物同步，不是功能实现或重构。未引入新业务逻辑；版本、CHANGELOG 与 `go-usb-ai` UI dist 由仓库发布流程生成。发布前校验覆盖了批次包的 build 和 tsc；release check 默认未启用 lint。

## NPM 包发布记录

需要发布：是。原因是用户明确要求发布正式 NPM 包，并且仓库存在完整 public release batch。

已发布并验证：

- `go-usb-ai@0.19.7`
- `@go-usb-ai/agent-chat@0.1.15`
- `@go-usb-ai/agent-chat-ui@0.3.17`
- `@go-usb-ai/app-runtime@0.7.5`
- `@go-usb-ai/app-sdk@0.1.5`
- `@go-usb-ai/channel-extension-feishu@0.1.1`
- `@go-usb-ai/channel-extension-weixin@0.1.4`
- `@go-usb-ai/channel-plugin-dingtalk@0.2.48`
- `@go-usb-ai/channel-plugin-discord@0.2.48`
- `@go-usb-ai/channel-plugin-email@0.2.48`
- `@go-usb-ai/channel-plugin-mochat@0.2.48`
- `@go-usb-ai/channel-plugin-qq@0.2.48`
- `@go-usb-ai/channel-plugin-slack@0.2.48`
- `@go-usb-ai/channel-plugin-telegram@0.2.48`
- `@go-usb-ai/channel-plugin-wecom@0.2.48`
- `@go-usb-ai/channel-plugin-whatsapp@0.2.48`
- `@go-usb-ai/channel-runtime@0.4.34`
- `@go-usb-ai/client-sdk@0.1.5`
- `@go-usb-ai/companion@0.1.5`
- `@go-usb-ai/core@0.12.17`
- `@go-usb-ai/extension-sdk@0.1.4`
- `@go-usb-ai/feishu-core@0.2.11`
- `@go-usb-ai/kernel@0.1.6`
- `@go-usb-ai/mcp@0.1.82`
- `@go-usb-ai/ncp@0.5.10`
- `@go-usb-ai/ncp-agent-runtime@0.3.20`
- `@go-usb-ai/ncp-http-agent-client@0.3.22`
- `@go-usb-ai/ncp-http-agent-server@0.3.22`
- `@go-usb-ai/ncp-mcp@0.1.84`
- `@go-usb-ai/ncp-react@0.4.30`
- `@go-usb-ai/ncp-react-ui@0.2.22`
- `@go-usb-ai/ncp-toolkit@0.5.15`
- `@go-usb-ai/go-usb-ai-hermes-acp-bridge@0.1.9`
- `@go-usb-ai/go-usb-ai-narp-runtime-claude-code-sdk@0.1.7`
- `@go-usb-ai/go-usb-ai-narp-runtime-codex-sdk@0.1.8`
- `@go-usb-ai/go-usb-ai-narp-stdio-runtime-wrapper@0.1.4`
- `@go-usb-ai/go-usb-ai-ncp-runtime-adapter-hermes-http@0.1.9`
- `@go-usb-ai/go-usb-ai-ncp-runtime-claude-code-sdk@0.1.32`
- `@go-usb-ai/go-usb-ai-ncp-runtime-codex-sdk@0.1.31`
- `@go-usb-ai/go-usb-ai-ncp-runtime-http-client@0.1.9`
- `@go-usb-ai/go-usb-ai-ncp-runtime-plugin-claude-code-sdk@0.1.63`
- `@go-usb-ai/go-usb-ai-ncp-runtime-plugin-codex-sdk@0.1.65`
- `@go-usb-ai/go-usb-ai-ncp-runtime-stdio-client@0.1.10`
- `@go-usb-ai/openclaw-compat@1.0.17`
- `@go-usb-ai/remote@0.1.94`
- `@go-usb-ai/runtime@0.2.49`
- `@go-usb-ai/server@0.12.17`
- `@go-usb-ai/service@0.1.8`
- `@go-usb-ai/shared@0.1.4`
- `@go-usb-ai/ui@0.12.25`

发布后状态：

- `go-usb-ai` dist-tag：`latest = 0.19.7`，`beta = 0.18.12-beta.22`。
- `@go-usb-ai/channel-extension-feishu` dist-tag：`latest = 0.1.1`。
