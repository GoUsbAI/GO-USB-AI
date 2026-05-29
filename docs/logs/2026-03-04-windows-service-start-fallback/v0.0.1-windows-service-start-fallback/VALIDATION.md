# VALIDATION

## 本地验证命令

```bash
pnpm -C packages/go-usb-ai build
pnpm -C packages/go-usb-ai lint
pnpm -C packages/go-usb-ai tsc
```

## 冒烟测试（隔离目录，避免写仓库）

```bash
export GOUSB_AI_HOME="$(mktemp -d /tmp/go-usb-ai-win-start-fix-XXXXXX)"
node packages/go-usb-ai/dist/cli/index.js init --force
node packages/go-usb-ai/dist/cli/index.js start --ui-port 19981
curl http://127.0.0.1:19981/api/health
node packages/go-usb-ai/dist/cli/index.js stop
rm -rf "$GOUSB_AI_HOME"
```

## 验收点

- `start` 输出后台 PID 和 UI/API 地址。
- `curl` 返回 `{"ok":true,...}`。
- `stop` 成功并清理状态文件。
