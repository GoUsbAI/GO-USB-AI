# v0.15.6-frontend-upstream-republish

## 迭代完成说明

完成前端上游依赖链的重新发布，确保所有变更的包版本都已同步发布到 npm。

- 处理了未完成的变更文件 `.changeset/frontend-upstream-republish-20260330.md`
- 运行 `changeset version` 更新了所有受影响包的版本号
- 成功发布了以下包到 npm：
  - `@go-usb-ai/agent-chat@0.1.6`
  - `@go-usb-ai/agent-chat-ui@0.2.18`
  - `@go-usb-ai/ncp-http-agent-client@0.3.9`
  - `@go-usb-ai/ncp-react@0.4.11`
  - `@go-usb-ai/ncp-react-ui@0.2.10`
  - `@go-usb-ai/ncp-toolkit@0.4.14`
  - `@go-usb-ai/ncp-mcp@0.1.63`
  - `@go-usb-ai/ncp-http-agent-server@0.3.9`
  - `@go-usb-ai/ncp-agent-runtime@0.3.5`
  - `@go-usb-ai/ncp@0.4.5`
  - `@go-usb-ai/go-usb-ai-ncp-runtime-plugin-claude-code-sdk@0.1.40`
  - `@go-usb-ai/go-usb-ai-ncp-runtime-plugin-codex-sdk@0.1.40`
  - `@go-usb-ai/go-usb-ai-ncp-runtime-claude-code-sdk@0.1.16`
  - `@go-usb-ai/go-usb-ai-ncp-runtime-codex-sdk@0.1.13`
  - `@go-usb-ai/openclaw-compat@0.3.55`
  - `@go-usb-ai/remote@0.1.73`
  - `@go-usb-ai/server@0.11.21`
  - `@go-usb-ai/ui@0.11.20`
  - `go-usb-ai@0.16.30`

- 创建了对应的 git tag
- 提交了版本更新：`chore(release): update versions for frontend upstream republish`

## 测试/验证/验收方式

- 通过 `npm view` 验证所有包已发布到 npm registry
- 确认 git tag 已正确创建
- 版本号已按变更文件要求更新

## 发布/部署方式

- 通过标准 changeset 流程完成发布
- 使用项目 `.npmrc` 进行 npm 认证
- 发布完成后自动创建 git tag

## 用户/产品视角的验收步骤

1. 用户现在可以安装最新版本的包：`npm install go-usb-ai@0.16.30`
2. 所有前端相关依赖链已同步更新
3. 确保前端应用能正确拉取到更新后的依赖
