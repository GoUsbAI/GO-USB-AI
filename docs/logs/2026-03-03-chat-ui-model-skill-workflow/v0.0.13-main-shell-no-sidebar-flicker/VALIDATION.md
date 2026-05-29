# v0.0.13 Validation

## 执行命令

- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-ui build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-ui lint`

## 结果

- `tsc`：通过。
- `build`：通过。
- `lint`：未通过，存在仓库既有错误（非本次改动引入）：
  - `packages/go-usb-ai-ui/src/components/common/MaskedInput.tsx` 未使用参数。
  - `packages/go-usb-ai-ui/src/components/config/ProviderForm.tsx` 未使用变量。
  - 其余为既有 `max-lines` 警告。

## 冒烟验证（UI）

1. 在主界面来回切换 `/chat`、`/skills`、`/cron`。
2. 观察左侧边栏：不再整块闪烁/抖动。
3. 观察右侧内容区：正常切换显示目标页面内容。
