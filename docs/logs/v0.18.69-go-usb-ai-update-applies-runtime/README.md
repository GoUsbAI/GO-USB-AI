# v0.18.69-go-usb-ai-update-applies-runtime

## 迭代完成说明

- 根因：`go-usb-ai update` 的默认行为只下载 runtime bundle，没有应用下载后的 runtime；用户执行 `go-usb-ai update && go-usb-ai restart` 时会自然理解为“更新后重启”，但实际结果是“下载新版后重启旧版”。
- 确认方式：本地状态和接口显示 `downloadedVersion=0.19.7`、`currentVersion=0.19.6`，服务进程仍从全局 npm `go-usb-ai@0.19.6` 的 app entry 启动。
- 修复方式：把 `NpmRuntimeUpdateManager.run()` 的默认语义改为下载后立即应用；`--download-only` 才保留“只下载不切换”的高级路径；gateway `update.run` 改为复用同一默认语义。
- 同步修复：npm runtime update 冒烟脚本先构建 `@go-usb-ai/service` 再构建 `go-usb-ai`，避免用旧 service dist 验证出假结果；update contract 导入统一回到 `@go-usb-ai/kernel` 根公共入口。

## 测试/验证/验收方式

- `pnpm -C packages/go-usb-ai-service tsc`：通过。
- `pnpm -C packages/go-usb-ai tsc`：通过。
- `pnpm -C packages/go-usb-ai-service lint`：通过，保留既有 warning。
- `pnpm -C packages/go-usb-ai lint`：通过。
- `pnpm -C packages/go-usb-ai-service test -- src/launcher/npm-runtime-update.manager.test.ts`：通过，8 个用例通过。
- `pnpm -C packages/go-usb-ai smoke:npm-runtime-update`：通过，覆盖 `update --check --json`、裸 `update --json` 应用 runtime、应用后 launcher `--version`。
- `node .agents/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --non-feature --paths ...`：通过，非测试代码净增 0 行。
- `pnpm lint:new-code:governance -- --files ...`：通过。
- `pnpm check:governance-backlog-ratchet`：通过。

## 发布/部署方式

- 本次执行 NPM stable patch 发布，目标版本为 `go-usb-ai@0.19.8` 与 `@go-usb-ai/service@0.1.9`。
- 不涉及数据库 migration、远程 deploy 或线上 API smoke。

## 用户/产品视角的验收步骤

1. 安装包含本修复的 `go-usb-ai` 版本。
2. 执行 `go-usb-ai update`。
3. 观察命令输出应进入 applied / restart-required 状态，而不是停在 downloaded 状态。
4. 执行 `go-usb-ai restart` 后打开 UI，版本应反映已应用的 runtime。
5. 只有显式执行 `go-usb-ai update --download-only` 时，才允许停留在 downloaded / staged 状态。

## 可维护性总结汇总

- 本次是非功能 bugfix，源码与脚本改动保持非测试代码净增 0 行。
- 正向减债动作：简化与职责收敛。gateway 不再手写 download/apply 两步，统一复用 update command/manager 的默认语义。
- 补充减债：修复 service 测试配置暴露的 public import 问题，update contract 消费回到 `@go-usb-ai/kernel` 根公共入口。
- 已使用 `post-edit-maintainability-review` 口径复核：没有新增平行更新路径，默认 update、gateway update 和 smoke 验证都回到同一 owner。

## NPM 包发布记录

- 发布包：`go-usb-ai@0.19.8`、`@go-usb-ai/service@0.1.9`。
- dist-tag：`latest`。
- 发布原因：用户可见 CLI 契约修复，`go-usb-ai update` 必须真正完成更新。
- 发布后验证：以 npm registry 和真实安装 smoke 为准。
