# v0.0.7 Validation

## 执行命令

- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-core tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-core lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-ui lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-core build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-ui build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai build`

## 结果

- `tsc`（core/go-usb-ai/ui）通过。
- `build`（core/ui/go-usb-ai）通过。
- `lint`：core/go-usb-ai 仅 warning；ui 存在仓库既有未使用变量错误（与本次修复无关），因此 `pnpm -C packages/go-usb-ai-ui lint` 非绿。

## 冒烟测试

- 命令：
  - `PATH=/opt/homebrew/bin:$PATH GOUSB_AI_HOME=/tmp/go-usb-ai-smoke-stop node --input-type=module <<'EOF' ... EOF`
- 观察点：
  - 构造持续 tool call 的 provider，并在第 2 次调用时触发 `AbortController.abort(...)`。
  - 输出为：`SMOKE_ABORT_RESULT AbortError chat turn stopped by user`。
- 验收结论：
  - 手动中断语义已走 `AbortError`，不会进入 tool-loop fallback 文案。
