# v0.14.69-go-usb-ai-remote-access-lightweight-relay

## 迭代完成说明

- 为 GoUsbAi 增加轻量 remote access MVP：
  - platform backend 新增 remote device / remote session / relay Durable Object / remote proxy 路由。
  - `go-usb-ai` CLI 新增 `go-usb-ai remote connect`，用于把本机注册为远程设备并保持 connector 在线。
  - `@go-usb-ai/server` 新增本地 UI auth bridge，用于 remote relay 代表远程会话访问本地 UI。
  - `platform-console` 用户页新增“我的设备”卡片，可直接看到在线设备并点击 `Open`。
- 补了用户文档入口：
  - 在 [`docs/USAGE.md`](../../../docs/USAGE.md) 与 [`packages/go-usb-ai/templates/USAGE.md`](../../../packages/go-usb-ai/templates/USAGE.md) 中加入 `go-usb-ai login` / `go-usb-ai remote connect` 的接入说明。
- 修复了线上登录阻塞问题：
  - 将 platform worker 的 PBKDF2 默认迭代数收敛到 Cloudflare workerd 可接受范围，避免生产注册/登录时报 `requested 120000`。
- 设计文档：
  - [`docs/plans/2026-03-19-go-usb-ai-remote-access-relay-design.md`](../../../docs/plans/2026-03-19-go-usb-ai-remote-access-relay-design.md)

## 测试 / 验证 / 验收方式

- 本地构建与类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/go-usb-ai-provider-gateway-api build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/go-usb-ai-provider-gateway-api tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-server build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-server lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai-server tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/go-usb-ai tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/platform-console build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/platform-console lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/platform-console tsc`
- 本地 remote 冒烟：
  - 启动本地 worker dev + 本地 GoUsbAi UI。
  - `go-usb-ai login --api-base http://127.0.0.1:8790/v1 --register`
  - `go-usb-ai remote connect --api-base http://127.0.0.1:8790/v1`
  - 通过 `POST /platform/remote/devices/:deviceId/open` 创建会话。
  - 使用 `curl` 携带 remote session cookie 验证：
    - `http://127.0.0.1:8790/` 返回 GoUsbAi UI HTML
    - `http://127.0.0.1:8790/api/health` 返回健康 JSON
- 线上 remote 冒烟：
  - `go-usb-ai login --api-base https://ai-gateway-api.go-usb-ai.io/v1 --register`
  - `go-usb-ai remote connect --api-base https://ai-gateway-api.go-usb-ai.io/v1`
  - 通过生产 `openUrl` 打开 remote session。
  - 使用 `curl` 验证：
    - `https://ai-gateway-api.go-usb-ai.io/` 返回 GoUsbAi UI HTML
    - `https://ai-gateway-api.go-usb-ai.io/api/health` 返回健康 JSON
- npm 发布验收：
  - `npm view go-usb-ai@0.13.0 version`
  - `npm view @go-usb-ai/server@0.10.0 version`
  - `GOUSB_AI_HOME=$(mktemp -d /tmp/go-usb-ai-publish-smoke.XXXXXX) npx -y go-usb-ai@0.13.0 remote --help`
- 已知基线说明：
  - `pnpm release:publish` 被仓库既有 lint 基线阻塞，阻塞点在与本次无关的 `@go-usb-ai/core` 历史 lint error，因此本次 npm 发布改为 `changeset publish` 手动闭环。

## 发布 / 部署方式

- 数据库 migration：
  - `PATH=/opt/homebrew/bin:$PATH pnpm dlx wrangler@4.75.0 d1 migrations apply GOUSB_AI_PLATFORM_DB --remote --config workers/go-usb-ai-provider-gateway-api/wrangler.toml`
- backend 部署：
  - `PATH=/opt/homebrew/bin:$PATH pnpm dlx wrangler@4.75.0 deploy --config workers/go-usb-ai-provider-gateway-api/wrangler.toml`
  - 当前 worker version: `65fc8e2c-9549-4b84-8c4a-1236c3a14263`
- frontend 部署：
  - `PATH=/opt/homebrew/bin:$PATH pnpm deploy:platform:console`
  - `PATH=/opt/homebrew/bin:$PATH pnpm deploy:platform:admin`
- npm 发布：
  - `PATH=/opt/homebrew/bin:$PATH pnpm release:version`
  - `PATH=/opt/homebrew/bin:$PATH pnpm changeset publish`
  - 已发布：
    - `go-usb-ai@0.13.0`
    - `@go-usb-ai/server@0.10.0`

## 用户 / 产品视角的验收步骤

1. 在要被远程访问的电脑上安装最新 `go-usb-ai@0.13.0`，并启动本地 UI：`go-usb-ai start` 或 `go-usb-ai serve`。
2. 在这台电脑上执行：
   - `go-usb-ai login --api-base https://ai-gateway-api.go-usb-ai.io/v1`
   - `go-usb-ai remote connect`
3. 打开 GoUsbAi Platform，登录同一账号，进入用户页。
4. 在“我的设备”里确认目标设备显示为 `online`，点击 `Open`。
5. 新页面应直接打开这台电脑的 GoUsbAi UI；若继续请求 `api/health`，应返回本机服务的健康状态。
6. 当前 MVP 仅保证 HTTP / SSE remote proxy；若页面内依赖浏览器直连 WebSocket 的能力，MVP 会返回 `501`，后续再补充。
