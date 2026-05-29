# v0.13.113 ncp-error-exception-move-to-toolkit

## 迭代完成说明（改了什么）

- 将 `NcpErrorException` 从 `@go-usb-ai/ncp` 迁移到 `@go-usb-ai/ncp-toolkit`。
- `@go-usb-ai/ncp` 的 `types/errors.ts` 仅保留协议类型：`NcpErrorCode`、`NcpError`。
- 在 `@go-usb-ai/ncp-toolkit` 新增 `errors` 模块并通过根入口导出：
- `src/errors/ncp-error-exception.ts`
- `src/errors/index.ts`
- `src/index.ts`
- 更新 toolkit README 的 scope 说明，增加 `NcpErrorException`。

## 测试/验证/验收方式

- `pnpm -C packages/ncp-packages/go-usb-ai-ncp tsc`
- `pnpm -C packages/ncp-packages/go-usb-ai-ncp lint`
- `pnpm -C packages/ncp-packages/go-usb-ai-ncp-toolkit tsc`
- `pnpm -C packages/ncp-packages/go-usb-ai-ncp-toolkit lint`
- `pnpm -C packages/ncp-packages/go-usb-ai-ncp-toolkit test`

## 发布/部署方式

- 本次为包边界重构，不涉及部署。
- 若发布 npm 包，按项目既有流程执行 changeset/version/publish。

## 用户/产品视角的验收步骤

1. 在业务代码中从 `@go-usb-ai/ncp-toolkit` 导入 `NcpErrorException`。
2. 确认 `@go-usb-ai/ncp` 仅用于协议类型与接口定义。
3. 执行上述验证命令，确认构建和测试通过。
