# v0.18.22 Package Public Import Governance

## 迭代完成说明

本次修正 `@go-usb-ai-service` 拆包后的跨包引用边界：`packages/go-usb-ai` 不再深导入 `@go-usb-ai-service/shared`、`@go-usb-ai-service/commands` 等内部路径，统一通过 `@go-usb-ai-service` 根入口访问服务包公开能力。

根因是拆包后只完成了运行层面的可用性，没有把“可被其他 workspace 包依赖时只能走公共入口”的规则落到可执行检查里，导致跨包子路径导入没有被治理命令拦住。

本次通过三层闭环修复：补齐 `packages/go-usb-ai-service/src/index.ts` 公共出口；新增 `lint:new-code:package-public-imports` 检查并接入 `lint:new-code:governance`；同步更新常驻规则和相关 skills，避免后续继续漂移。

## 测试/验证/验收方式

- `pnpm lint:new-code:package-public-imports`
- 临时构造跨包深导入文件，确认 `lint:new-code:package-public-imports` 会报错；随后删除临时文件
- `pnpm lint:new-code:governance`
- `pnpm -C packages/go-usb-ai-service tsc`
- `pnpm -C packages/go-usb-ai tsc`
- `pnpm -C packages/go-usb-ai-service lint`
- `pnpm -C packages/go-usb-ai lint`
- `pnpm exec eslint scripts/governance/lint-new-code-package-public-imports.mjs scripts/governance/lint-new-code-governance.mjs`
- `pnpm -C packages/go-usb-ai-service build`
- `pnpm -C packages/go-usb-ai build`
- `pnpm check:governance-backlog-ratchet`
- `node .agents/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs`

## 发布/部署方式

未执行发布或部署。本次是源码边界和治理检查改造，待进入常规发布批次后随包发布。

## 用户/产品视角的验收步骤

1. 在 `packages/go-usb-ai` 中搜索 `@go-usb-ai-service/`，应无跨包深导入结果。
2. 运行 `pnpm lint:new-code:governance`，应包含 `package-public-imports` 并通过。
3. 手动新增任意 `packages/go-usb-ai` 到 `@go-usb-ai-service/shared/...` 的导入，运行 `pnpm lint:new-code:package-public-imports` 应失败。

## 可维护性总结汇总

本次属于新增治理能力和服务包公共入口收敛。维护性收益是跨包边界从口头规范变为自动检查，`go-usb-ai` 对 `go-usb-ai-service` 的依赖面更清晰。

常规 maintainability guard 已通过。由于新增治理脚本和公共出口，严格非功能净减门槛没有满足；本次变更的正当性来自新增可执行治理能力，而不是纯粹清理。

## NPM 包发布记录

不涉及 NPM 包发布。
