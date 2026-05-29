# v0.13.148-ui-auth-setup-toast-copy-update

## 迭代完成说明

- 按产品反馈增强首次设置认证成功后的右上角 toast 文案。
- 将 `authSetupSuccess` 从
  - `认证已开启，当前标签页已自动登录`
  调整为
  - `认证已开启，当前标签页已自动登录，可直接继续使用`
- 仅调整文案，不改动认证逻辑和交互流程。

## 测试/验证/验收方式

- 定向 lint：
  - `pnpm --filter @go-usb-ai/ui exec eslint src/lib/i18n.ts`

## 发布/部署方式

- 重新构建并部署 `@go-usb-ai/ui` 静态资源即可。
- 若通过 `go-usb-ai` 内置 UI 分发：
  - 重新构建 `packages/go-usb-ai-ui`
  - 同步到 `go-usb-ai/ui-dist`
  - 重启 UI 进程

## 用户/产品视角的验收步骤

1. 打开 `Security` 页面，首次完成管理员账号设置。
2. 观察右上角 toast，确认显示：
   - `认证已开启，当前标签页已自动登录，可直接继续使用`
