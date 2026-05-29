# v0.0.8 Validation

## 执行命令

- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-core tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-core build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-core lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai tsc`

## 结果

- `go-usb-ai-core` 的 `tsc/build` 通过。
- `go-usb-ai-core lint` 通过（仅既有 max-lines warnings，无新增 error）。
- `go-usb-ai tsc` 通过。

## 冒烟测试

- 在隔离目录执行（`GOUSB_AI_HOME=/tmp/go-usb-ai-smoke-stop-persist`）模拟流式多工具 + 中途 stop。
- 观察点：
  - 输出 `SMOKE_ABORT AbortError chat turn stopped by user`。
  - 输出 `SMOKE_SESSION_FILE_EXISTS true`。
  - session 文件行数 > 1，包含 metadata + 事件。
- 结论：中断后会话已持久化，不会因刷新而“消失”。
