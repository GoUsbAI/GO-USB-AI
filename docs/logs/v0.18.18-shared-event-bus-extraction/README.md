# v0.18.18-shared-event-bus-extraction

## 迭代完成说明

本次迭代完成 EventBus 共享核心抽离：

- 新增 `@go-usb-ai/shared` 轻量共享包，承载通用 `EventBus`、事件 key、实时事件 envelope 与更新快照类型。
- `@go-usb-ai/kernel` 改为从 `@go-usb-ai/shared` 复用并 re-export 事件能力，删除原本内置的 EventBus 实现与重复类型。
- `@go-usb-ai/client-sdk` 改为直接依赖 `@go-usb-ai/shared`，不再为了使用 EventBus 和 update 类型依赖 kernel。
- `@go-usb-ai/core` 的 typed event bus 改为复用 shared EventBus，保留自己的 typed-key 语义外壳。
- 对直接源码消费 `core` / `kernel` 的包补齐 `@go-usb-ai/shared` 与包级唯一 `@core/*` path 映射，避免跨包源码编译时 alias 漂移。
- 将“可被其他 workspace 以源码方式依赖的 package/SDK/shared library 不能使用泛化 `@/`”写入 `collapsible-feature-root-architecture` skill；`client-sdk` 内部导入回到相对路径，不再向 UI 注入 `@/services` / `@/types` / `@/utils` 补丁映射。

这是插件/extension SDK 改造前置的结构改造：先把 event bus 放到更合适的共享层，避免未来 extension-sdk、client-sdk、kernel 之间继续形成不必要依赖。

## 测试/验证/验收方式

本次执行：

- `pnpm -C packages/go-usb-ai-shared tsc`
- `pnpm -C packages/go-usb-ai-kernel tsc`
- `pnpm -C packages/go-usb-ai-client-sdk tsc`
- `pnpm -C packages/go-usb-ai-core tsc`
- `pnpm -C packages/go-usb-ai-server tsc`
- `pnpm -C packages/go-usb-ai-ui tsc`
- `pnpm -C packages/go-usb-ai tsc`
- `pnpm -C packages/go-usb-ai-runtime tsc`
- `pnpm -C packages/go-usb-ai-remote tsc`
- `pnpm -C packages/go-usb-ai-openclaw-compat tsc`
- `pnpm -C packages/go-usb-ai-mcp tsc`
- `pnpm -C packages/go-usb-ai-shared lint`
- `pnpm -C packages/go-usb-ai-kernel lint`
- targeted ESLint for touched `client-sdk` files
- targeted ESLint for touched `core` typed-event-bus file
- `pnpm -C packages/go-usb-ai-shared test`
- `pnpm -C packages/go-usb-ai-kernel test`
- `pnpm -C packages/go-usb-ai-client-sdk test`
- `pnpm -C packages/go-usb-ai-core exec vitest run src/features/typed-event-bus/services/typed-event-bus.test.ts`
- `pnpm -C packages/go-usb-ai-shared build`
- `pnpm -C packages/go-usb-ai-kernel build`
- `pnpm -C packages/go-usb-ai-client-sdk build`
- `pnpm -C packages/go-usb-ai-core build`
- `pnpm lint:new-code:governance`
- `pnpm check:governance-backlog-ratchet`
- `node .agents/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --non-feature`

结果：通过。

说明：`pnpm -C packages/go-usb-ai-client-sdk lint` 被既有 `src/services/request.service.ts` 的 `max-statements` warning 阻塞；本次触达文件的 targeted ESLint 已通过。

## 发布/部署方式

不涉及线上部署、数据库 migration 或 runtime update channel 发布。

本次新增 `@go-usb-ai/shared` workspace 包，并调整多个包的 workspace 依赖；后续统一 NPM 发布时需要将 `@go-usb-ai/shared` 与依赖它的包纳入同一发布批次评估。

## 用户/产品视角的验收步骤

本次是架构前置改造，用户侧直接行为不变。可从产品链路侧验收：

1. 正常启动 GoUsbAi 开发服务。
2. UI 能继续通过 `/ws` 接收已有 app event。
3. client SDK 的 `eventBus` 订阅行为保持不变。
4. session / runtime update 等现有 realtime 事件类型保持兼容。

## 可维护性总结汇总

- `post-edit-maintainability-review` 结论：通过。
- 代码增减报告：新增 508 行，删除 532 行，净增 -24 行。
- 非测试代码增减报告：新增 408 行，删除 449 行，净增 -41 行。
- 正向减债动作：删除、复用、必要解耦抽象。
- 本次删除 kernel 内重复 EventBus 与事件类型实现，core typed-event-bus 复用共享实现，client-sdk 解除对 kernel 的间接依赖。
- 没有通过压缩代码制造行数收益；主要减少来自删除重复实现和收敛共享 owner。
- maintainability guard 仍提示 `packages/go-usb-ai-client-sdk/src/services` 目录文件数已有历史预算 warning；本次没有新增该目录文件，未扩大该债务。

## NPM 包发布记录

本次未执行 NPM 发布。

后续若发布，需要评估并统一处理：

- `@go-usb-ai/shared`
- `@go-usb-ai/kernel`
- `@go-usb-ai/core`
- `@go-usb-ai/client-sdk`
- 直接或间接依赖上述包的 GoUsbAi workspace 包
