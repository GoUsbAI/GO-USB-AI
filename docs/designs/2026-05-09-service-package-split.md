# GoUsbAi Service Package Split

## 目标

把常驻服务进程的启动与生命周期职责从 `go-usb-ai` CLI 包中拆出，形成清晰的服务宿主包边界。

本次改造不新增用户功能，不改变 HTTP API、WebSocket API、NCP 协议、插件协议或配置文件语义。目标只聚焦三件事：

- `go-usb-ai` 只承担 CLI 命令入口、命令解析、短命命令执行和常驻服务进程控制。
- `@go-usb-ai-service` 承担常驻服务进程的 runtime host 职责。
- `@go-usb-ai/runtime` import 不产生全局副作用；内置 provider registry 只在常驻服务启动入口显式安装。

## 当前问题

`packages/go-usb-ai` 当前同时承担两类职责：

- 短生命周期 CLI：用户每次输入命令都会启动一次，适合处理 `start`、`stop`、`config`、`plugins` 等命令。
- 长生命周期服务宿主：`serve`、`ui`、`gateway` 以及 `start` 拉起的后台进程，会长期运行 UI server、NCP agent、channels、cron、plugin gateways、config watcher 等能力。

这导致副作用 owner 不清晰。放在 CLI 顶层会污染每次命令执行；放在 `@go-usb-ai/server` 会让 server 组件承担产品 bootstrap；放在 `@go-usb-ai/runtime` import 顶层会破坏 library import 的 0 side effect 边界。

## 最终包边界

### `go-usb-ai`

`go-usb-ai` 是产品 CLI 包。

保留职责：

- CLI 入口与命令注册。
- 短命命令解析与分派。
- `start` / `stop` / `restart` / `status` 等常驻服务进程控制。
- spawn 后台服务进程。
- CLI 本地状态读写与用户输出。

不承担职责：

- 不直接拥有常驻 gateway runtime 主链路。
- 不在 CLI 顶层执行 provider registry install。
- 不在普通 CLI 命令 import 时启动长期运行对象。

### `@go-usb-ai-service`

`@go-usb-ai-service` 是常驻服务宿主包。

承担职责：

- 常驻 gateway runtime 启动入口。
- 显式 runtime bootstrap。
- 内置 provider registry install。
- UI server 启动编排。
- NCP agent runtime 启动编排。
- channel / plugin gateway / cron / config watcher / restart sentinel 生命周期编排。
- service runtime 相关 controller、support service、startup context 和 lifecycle owner。
- 与常驻服务强耦合的控制面命令实现，例如 channel、plugin、remote、platform-auth、service、learning-loop、NCP runtime 管理。

### `@go-usb-ai/server`

`@go-usb-ai/server` 是 HTTP/WebSocket server 组件。

承担职责：

- Hono routes / controllers。
- `/api` 与 `/ws`。
- 通过注入的 host/service/callback 访问常驻服务能力。
- 把事件总线事件转发给 WebSocket client。
- 可以读取只读 provider metadata 供 UI 配置页展示。

不承担职责：

- 不安装 provider registry。
- 不做产品 runtime bootstrap。
- 不管理常驻服务生命周期。

### `@go-usb-ai/runtime`

`@go-usb-ai/runtime` 是底层 runtime 能力声明包。

承担职责：

- 暴露内置 provider / channel 的声明能力。
- 提供显式 install API。

不承担职责：

- import 时不修改全局 provider registry。
- import 时不启动服务、不读写文件、不挂事件、不创建 watcher。

## 迁移范围

本次把 `packages/go-usb-ai/src/cli/shared`、`packages/go-usb-ai/src/cli/launcher/npm-runtime-*`，以及与常驻服务强耦合的 channel、plugin、remote、platform-auth、service、learning-loop、NCP runtime 管理命令迁入 `packages/go-usb-ai-service/src`。

`packages/go-usb-ai` 中保留产品 CLI 入口、命令注册和不依赖常驻服务主链路的短命命令。CLI 通过 `@go-usb-ai-service` 调用常驻服务与服务控制面能力。

不迁移不依赖常驻服务主链路的普通 CLI 命令，不迁移 UI server，不迁移 core/runtime/server 的公共 API。

## 副作用归属

唯一允许执行内置 provider registry install 的位置是 `@go-usb-ai-service` 的常驻 gateway 启动入口。

具体规则：

- `import "@go-usb-ai/runtime"` 不安装 provider registry。
- `import "@go-usb-ai/server"` 不安装 provider registry。
- `import "go-usb-ai"` 或启动普通 CLI 命令不安装 provider registry。
- `go-usb-ai serve`、`go-usb-ai ui`、`go-usb-ai gateway`、`go-usb-ai start` 拉起的后台 `serve` 在进入常驻 gateway runtime 前显式安装一次 provider registry。

## 验收标准

- `@go-usb-ai-service` 包存在，且承担常驻服务主链路。
- `go-usb-ai` CLI 仍能注册和执行原有命令。
- `go-usb-ai start` 仍通过后台 `serve` 拉起常驻服务。
- `go-usb-ai serve` / `go-usb-ai ui` / `go-usb-ai gateway` 仍走同一常驻服务主链路。
- `@go-usb-ai/server` 不执行 runtime bootstrap。
- `@go-usb-ai/runtime` import 不产生 provider registry 全局注册副作用。
- TypeScript、ESLint、常驻服务 smoke、governance 与 maintainability 验证通过。
