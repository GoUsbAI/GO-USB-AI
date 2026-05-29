# v0.8.50-release-publish-0.8.42

## 迭代完成说明（改了什么）

本次完成“发布 + 提交”闭环，已将本轮功能与修复版本化并发布到 npm。

- 版本提交：`chore: version packages for release`（commit: `38a1069`）
- 发布命令执行：`pnpm release:publish`
- 实际发布包：
  - `@go-usb-ai/core@0.6.38`
  - `@go-usb-ai/channel-runtime@0.1.21`
  - `@go-usb-ai/openclaw-compat@0.1.29`
  - `@go-usb-ai/server@0.5.21`
  - `@go-usb-ai/ui@0.5.30`
  - `go-usb-ai@0.8.42`
- 已推送 `master` 与 tags 到远端。

## 测试 / 验证 / 验收方式

- 发布前校验（`release:publish` 内置执行）：
  - `pnpm build`
  - `pnpm lint`
  - `pnpm tsc`
- 结果：全部通过（lint 仅既有 warning，无 error）。
- 发布结果校验：changeset 输出显示 6 个目标包 publish success，并创建对应 tag。

## 发布 / 部署方式

- 使用项目标准流程：
  1. `pnpm release:version`
  2. `pnpm release:publish`
- 远程 migration：不适用（本次无后端数据库结构变更）。

## 用户/产品视角的验收步骤

1. 在 npm 检查以下版本是否可见：
   - `@go-usb-ai/core@0.6.38`
   - `@go-usb-ai/channel-runtime@0.1.21`
   - `@go-usb-ai/openclaw-compat@0.1.29`
   - `@go-usb-ai/server@0.5.21`
   - `@go-usb-ai/ui@0.5.30`
   - `go-usb-ai@0.8.42`
2. 本地执行安装验证：`npm i -g go-usb-ai@0.8.42`。
3. 运行 `go-usb-ai doctor` 或一次基础启动流程，确认可用。
4. 验收标准：版本可安装、可启动、核心路径可用。
