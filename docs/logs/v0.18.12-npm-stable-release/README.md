# v0.18.12 NPM 正式版发布记录

## 迭代完成说明

本次按用户要求只完成 NPM 正式版发布，不触发 runtime update channel、桌面包、线上服务部署或 PR 流程。

发布目标是把已验证的 beta 队列退出 prerelease，并发布为稳定 NPM 包批次。其中 `go-usb-ai` 从 npm `latest=0.18.11`、`beta=0.18.12-beta.22` 推进到 `latest=0.18.12`。

发布前发现 `.changeset/fix-managed-runtime-apply-version.md` frontmatter 开头多了一个引号，导致 changeset 文件格式不标准。已修正为标准 frontmatter 后继续发布。

## 测试/验证/验收方式

- `pnpm changeset status --verbose`：退出 pre mode 前确认常规 release 为 0 包，退出后确认正式版候选批次。
- `pnpm release:version`：通过 README 同步检查与 release group guard，并生成正式版版本和 changelog。
- `pnpm release:publish`：完成 release batch build + TypeScript 检查、NPM 发布、registry 轮询验证与本地 tag 创建。
- `pnpm release:verify:published`：确认 44/44 个包版本已在 npm registry 可见。
- `npm view go-usb-ai dist-tags --json`：确认 `latest` 指向 `0.18.12`，`beta` 保持 `0.18.12-beta.22`。
- 临时目录安装 `go-usb-ai@latest`，隔离 `GOUSB_AI_HOME` 运行 `go-usb-ai --version`，结果为 `0.18.12`。
- 检查安装包内容：`dist/cli/launcher/index.js`、`dist/cli/app/index.js`、`resources/update-bundle-public.pem` 均存在。

## 发布/部署方式

发布方式：

```bash
pnpm changeset pre exit
pnpm release:version
pnpm release:publish
```

Runtime bundle 发布方式：

```bash
git push origin master
git tag --points-at HEAD | sort | xargs git push origin
gh workflow run npm-runtime-update-release.yml --ref master -f channel=stable -f release_tag=go-usb-ai@0.18.12
```

Runtime bundle 发布结果：

- GitHub Actions run：`https://github.com/Peiiii/go-usb-ai/actions/runs/25507214688`
- GitHub Release：`https://github.com/Peiiii/go-usb-ai/releases/tag/go-usb-ai%400.18.12`
- Release assets：
  - `go-usb-ai-runtime-darwin-arm64-0.18.12.zip`
  - `go-usb-ai-runtime-darwin-x64-0.18.12.zip`
  - `go-usb-ai-runtime-linux-x64-0.18.12.zip`
  - `go-usb-ai-runtime-win32-x64-0.18.12.zip`
- gh-pages source manifests 已更新到 `latestVersion=0.18.12`、`minimumLauncherVersion=0.18.11`、`hostKind=npm-runtime-bundle`。
- GitHub Pages 公开 manifest 曾有短暂 CDN 延迟，随后四个平台公开 URL 均刷新到 `0.18.12`。

不涉及项：

- 桌面安装包/DMG/更新清单：不属于本次范围。
- 后端 migration / 线上 deploy / 线上 API smoke：本次没有后端或数据库变更。
- PR：用户没有要求，未执行。

## 用户/产品视角的验收步骤

用户可以通过以下方式验收 NPM 正式版：

```bash
npm view go-usb-ai dist-tags --json
npm install -g go-usb-ai@latest
go-usb-ai --version
```

预期：

- `latest` 为 `0.18.12`。
- 新安装或隔离 home 下运行 `go-usb-ai --version` 输出 `0.18.12`。
- `go-usb-ai@0.18.11` 使用旧版默认 `go-usb-ai update` 能完成 stable runtime 更新，日志显示 `Version updated: 0.18.11 -> 0.18.12`。

注意：本机默认 `GOUSB_AI_HOME` 如果已有旧 runtime bundle 指针，可能显示旧 runtime 版本；隔离 `GOUSB_AI_HOME` 已确认 NPM 包本身正常。

## 可维护性总结汇总

本次主要是发布元数据和版本/changelog 更新，不涉及源码实现改动；代码可维护性评估不适用。

可维护性相关动作：

- 没有新增生产逻辑、fallback 或运行时分支。
- 修正了一个 malformed changeset frontmatter，降低后续发布解析风险。
- 发布流程使用仓库既有 release owner，没有引入平行发布脚本。

## NPM 包发布记录

本次 NPM 发布涉及以下 44 个包，registry 验证结果为 44/44 已发布：

- `go-usb-ai@0.18.12`
- `@go-usb-ai/agent-chat@0.1.11`
- `@go-usb-ai/agent-chat-ui@0.3.13`
- `@go-usb-ai/app-runtime@0.7.1`
- `@go-usb-ai/app-sdk@0.1.1`
- `@go-usb-ai/channel-plugin-dingtalk@0.2.44`
- `@go-usb-ai/channel-plugin-discord@0.2.44`
- `@go-usb-ai/channel-plugin-email@0.2.44`
- `@go-usb-ai/channel-plugin-feishu@0.2.29`
- `@go-usb-ai/channel-plugin-mochat@0.2.44`
- `@go-usb-ai/channel-plugin-qq@0.2.44`
- `@go-usb-ai/channel-plugin-slack@0.2.44`
- `@go-usb-ai/channel-plugin-telegram@0.2.44`
- `@go-usb-ai/channel-plugin-wecom@0.2.44`
- `@go-usb-ai/channel-plugin-weixin@0.1.38`
- `@go-usb-ai/channel-plugin-whatsapp@0.2.44`
- `@go-usb-ai/channel-runtime@0.4.30`
- `@go-usb-ai/client-sdk@0.1.1`
- `@go-usb-ai/companion@0.1.1`
- `@go-usb-ai/core@0.12.13`
- `@go-usb-ai/feishu-core@0.2.7`
- `@go-usb-ai/kernel@0.1.2`
- `@go-usb-ai/mcp@0.1.78`
- `@go-usb-ai/ncp@0.5.6`
- `@go-usb-ai/ncp-agent-runtime@0.3.16`
- `@go-usb-ai/ncp-http-agent-client@0.3.18`
- `@go-usb-ai/ncp-http-agent-server@0.3.18`
- `@go-usb-ai/ncp-mcp@0.1.80`
- `@go-usb-ai/ncp-react@0.4.26`
- `@go-usb-ai/ncp-react-ui@0.2.18`
- `@go-usb-ai/ncp-toolkit@0.5.11`
- `@go-usb-ai/go-usb-ai-hermes-acp-bridge@0.1.5`
- `@go-usb-ai/go-usb-ai-ncp-runtime-adapter-hermes-http@0.1.5`
- `@go-usb-ai/go-usb-ai-ncp-runtime-claude-code-sdk@0.1.26`
- `@go-usb-ai/go-usb-ai-ncp-runtime-codex-sdk@0.1.23`
- `@go-usb-ai/go-usb-ai-ncp-runtime-http-client@0.1.5`
- `@go-usb-ai/go-usb-ai-ncp-runtime-plugin-claude-code-sdk@0.1.57`
- `@go-usb-ai/go-usb-ai-ncp-runtime-plugin-codex-sdk@0.1.57`
- `@go-usb-ai/go-usb-ai-ncp-runtime-stdio-client@0.1.6`
- `@go-usb-ai/openclaw-compat@1.0.13`
- `@go-usb-ai/remote@0.1.90`
- `@go-usb-ai/runtime@0.2.45`
- `@go-usb-ai/server@0.12.13`
- `@go-usb-ai/ui@0.12.20`

`go-usb-ai` dist-tags:

```json
{
  "latest": "0.18.12",
  "beta": "0.18.12-beta.22"
}
```

## NPM runtime bundle 发布记录

本次已发布 stable channel NPM runtime bundle。

Manifest 状态：

- `manifest-stable-darwin-arm64.json`：`latestVersion=0.18.12`，`minimumLauncherVersion=0.18.11`
- `manifest-stable-darwin-x64.json`：`latestVersion=0.18.12`，`minimumLauncherVersion=0.18.11`
- `manifest-stable-linux-x64.json`：`latestVersion=0.18.12`，`minimumLauncherVersion=0.18.11`
- `manifest-stable-win32-x64.json`：`latestVersion=0.18.12`，`minimumLauncherVersion=0.18.11`

验收：

- `gh run watch 25507214688 --exit-status`：成功。
- `gh release view go-usb-ai@0.18.12`：确认四个平台 runtime zip assets 存在。
- `gh api repos/Peiiii/go-usb-ai/contents/npm-runtime-updates/stable/... --ref gh-pages`：确认 gh-pages manifest 为 `0.18.12`。
- 公开 GitHub Pages URL 轮询后确认四个平台 manifest 为 `0.18.12`。
- 隔离临时目录安装 `go-usb-ai@0.18.11` 后运行 `go-usb-ai update`：成功输出 `Version updated: 0.18.11 -> 0.18.12`。
