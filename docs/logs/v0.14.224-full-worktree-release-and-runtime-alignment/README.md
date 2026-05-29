# v0.14.224-full-worktree-release-and-runtime-alignment

## 迭代完成说明

- 将当前工作区中已完成但尚未正式发布的 CLI、server、dev-runner、UI 产物与相关文档改动一并纳入同一轮发布与提交。
- 补发 `@go-usb-ai/ncp-agent-runtime`，修复 `go-usb-ai update` 后 CLI 运行时引用 `LocalAttachmentStore` 却仍安装到旧导出面的版本错配问题。
- 让 `go-usb-ai` 与其直接依赖版本重新对齐，避免出现主包已发布、运行时依赖包仍停留在旧内容的破坏性升级。
- 为发布流程增加守卫：若某个 public workspace package 在已发布 tag 之后仍有源码漂移、但又未进入 pending changeset，则直接阻止继续发布依赖它的包。

## 测试/验证/验收方式

- 运行针对本轮改动的最小充分验证：
  - `node scripts/check-release-groups.mjs`
  - `pnpm -C packages/ncp-packages/go-usb-ai-ncp-agent-runtime build`
  - `pnpm -C packages/go-usb-ai-server exec vitest run src/ui/router.weixin-channel-auth.test.ts src/ui/router.weixin-channel-config.test.ts`
  - `pnpm -C packages/go-usb-ai exec vitest run src/cli/commands/service-remote-runtime.test.ts`
  - `pnpm -C packages/go-usb-ai-server build`
  - `pnpm -C packages/go-usb-ai build`
- 通过打包产物核验：
  - `go-usb-ai` tarball 中引用了 `LocalAttachmentStore`
  - `@go-usb-ai/ncp-agent-runtime` tarball 中已导出 `LocalAttachmentStore`
- 发布后再用 `npm view` 核验线上版本是否对齐。

## 发布/部署方式

- 按项目标准 NPM 流程补建 changeset，执行 `pnpm release:version`。
- 若整仓 `release:publish` 再次被无关历史 lint 问题阻塞，则保留本轮定向验证结果，执行 `pnpm changeset publish` 完成正式发布与打 tag。
- 本次不涉及远程 migration，也不涉及额外服务部署。

## 用户/产品视角的验收步骤

1. 在任意已全局安装旧版 CLI 的环境中执行 `go-usb-ai update`。
2. 确认升级后再次执行 `go-usb-ai restart` 不再出现 `LocalAttachmentStore` 导出缺失错误。
3. 若需要开发态验证，执行 `pnpm dev start`，确认 dev-runner 会打印 `GOUSB_AI_HOME`，且本地 remote origin / UI config reload 链路继续正常。
4. 如需渠道侧复验，继续确认 QQ、Discord、Weixin、Feishu 的消息链路与配置更新链路均恢复正常。
