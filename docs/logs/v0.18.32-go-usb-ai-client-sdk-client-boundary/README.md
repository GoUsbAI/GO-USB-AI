# v0.18.32-go-usb-ai-client-sdk-client-boundary

## 迭代完成说明

本轮将 `@go-usb-ai/client-sdk` 的顶层聚合对象从 `GoUsbAiClientService` 收敛为 `GoUsbAiClient`，并把实现从 `src/services/go-usb-ai-client.service.ts` 移到 `src/go-usb-ai-client.manager.ts`。

这次是结构重构，不是新增用户能力。核心判断是：SDK 根 client 是前端访问能力的汇总入口，不是 `services/` 目录里的领域 service；真实远程 IO 和协议实现仍保留在各自 service owner 内。

同步删除了只为旧 service class 服务的 `types/go-usb-ai-client.types.ts`，让公开 `GoUsbAiClient` class 自身成为类型来源；测试文件也去掉 `.service` 命名残留。

同批次继续删除空心 `createGoUsbAiClient(options)` factory，UI 与 companion 调用方改为直接 `new GoUsbAiClient(options)`。触达 UI API facade 时顺手把 classless `services/*.service.ts` 薄封装迁到 `utils/*.utils.ts`，避免继续扩大“没有 class 却叫 service”的旧债。

## 测试/验证/验收方式

- `pnpm --filter @go-usb-ai/client-sdk tsc`：通过。
- `pnpm --filter @go-usb-ai/ui tsc`：通过。
- `pnpm --filter @go-usb-ai/companion tsc`：通过。
- `pnpm --filter @go-usb-ai/client-sdk test`：通过，1 个测试文件、4 个用例。
- `pnpm --filter @go-usb-ai/ui exec vitest run src/shared/lib/api/ncp-session.test.ts src/shared/lib/api/client.test.ts`：通过，2 个测试文件、6 个用例。
- `pnpm --filter @go-usb-ai/client-sdk build`：通过，产物包含 `dist/go-usb-ai-client.manager.js` 与对应 d.ts。
- touched files targeted ESLint：通过。
- touched scope targeted `pnpm lint:new-code:governance`：通过。
- `pnpm check:governance-backlog-ratchet`：通过。
- `node .agents/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --non-feature --paths ...`：通过。

补充说明：`pnpm --filter @go-usb-ai/client-sdk lint` 被既有 `src/services/request.service.ts` 的 `max-statements` warning 阻塞；全量 `pnpm lint:new-code:governance` 被当前工作区其它 extension 包的 module-structure 改动阻塞。当前触达范围已用定向 ESLint 与定向 governance 验证通过。

## 发布/部署方式

未发布、未部署。本轮只调整源码结构与设计文档，`dist/` 为 gitignore 产物，未纳入提交面。

## 用户/产品视角的验收步骤

1. 使用 `new GoUsbAiClient(options)` 创建 SDK client。
2. 确认 `client.sessions.list()`、`client.agents.resolveAvatarUrl()`、`client.sessions.subscribe()` 与 `client.eventBus` 行为保持不变。
3. 从包入口导入 `GoUsbAiClient` 时，确认它不再暴露旧的 `GoUsbAiClientService` 命名。

## 可维护性总结汇总

- 本次使用 `post-edit-maintainability-review` 思路完成复核：结论通过。
- 正向减债动作：删除与职责收敛。删除旧 client type 文件、空心 factory 和旧 service 命名，把 SDK 根聚合对象移出 service 目录，并把 UI API classless facade 从 `services/` 收到 `utils/`。
- 没有通过压缩语句或降低可读性凑行数；改动主要来自文件角色重定位、导入路径更新和过期抽象删除。
- `services/` 目录少一个假 service 文件，SDK 根 client 的 owner 边界更清楚；真实 endpoint service 文件保持原职责不变。

## NPM 包发布记录

不涉及 NPM 包发布。
