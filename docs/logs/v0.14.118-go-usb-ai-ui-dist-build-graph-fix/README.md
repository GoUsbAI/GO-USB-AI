# v0.14.118-go-usb-ai-ui-dist-build-graph-fix

## 迭代完成说明

- 修复 `go-usb-ai` 打包链路中对 `@go-usb-ai/ui` 的隐式构建顺序依赖：
  - 在 `packages/go-usb-ai/package.json` 中为 `go-usb-ai` 增加显式工作区依赖 `@go-usb-ai/ui: workspace:*`（devDependency）。
  - 保证 `pnpm -r --filter @go-usb-ai/desktop... build` 时，`@go-usb-ai/ui` 会进入递归依赖图，并在 `go-usb-ai` 执行 `scripts/copy-ui-dist.mjs` 前先完成 `dist` 构建。
- 根因说明：
  - 前一轮 beta `v0.13.24-desktop.2` 虽然已经修复了 NCP 依赖链缺口，但 macOS / Linux fresh runner 仍在 `go-usb-ai build` 阶段失败。
  - 统一报错为 `UI dist not found at .../packages/go-usb-ai-ui/dist. Build @go-usb-ai/ui before packaging go-usb-ai.`，说明 `go-usb-ai` 的打包逻辑依赖 `@go-usb-ai/ui/dist`，但工作区依赖图并未显式声明这层关系。

## 测试/验证/验收方式

- 依赖图验证：
  - `pnpm -r --filter @go-usb-ai/desktop... list --depth -1`
  - 预期结果：输出中包含 `@go-usb-ai/ui`
- 构建闭环验证：
  - `pnpm install`
  - `pnpm -r --filter @go-usb-ai/desktop... build`
  - 预期结果：
    - `packages/go-usb-ai-ui build` 在 `packages/go-usb-ai build` 前执行
    - `packages/go-usb-ai build` 成功输出 `✓ UI dist copied to .../packages/go-usb-ai/ui-dist`
    - 最终 `apps/desktop build:main` 通过

## 发布/部署方式

- 提交并推送本次 `go-usb-ai` 构建图修复。
- 基于修复后的远端代码重新创建 desktop beta 预发布并触发 `desktop-release`。
- 待 beta 三平台全部通过后，再创建正式版 desktop release。
- 建议下一轮版号：
  - beta：`v0.13.24-desktop.3`
  - stable：`v0.13.24-desktop.4`

## 用户/产品视角的验收步骤

1. 打开新的 beta Release 页面，确认三平台产物齐全：macOS arm64/x64、Windows x64、Linux x64。
2. 在 macOS 安装 DMG 并打开应用，确认主界面可进入；若为无签名包，按发布说明执行“仍要打开”流程。
3. 在 Windows 解压并运行 `GoUsbAi Desktop.exe`，确认主界面可交互。
4. 在 Linux 启动 AppImage，确认应用可启动且健康检查通过。
5. beta 全绿后，检查正式版 Release 的版本号、资产列表和下载链接是否与 beta 验收结果一致。
