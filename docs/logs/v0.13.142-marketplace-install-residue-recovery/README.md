# v0.13.142-marketplace-install-residue-recovery

## 迭代完成说明

- 修复 `go-usb-ai` marketplace skill 安装时对残留目录的误判。
- 调整 [packages/go-usb-ai/src/cli/skills/marketplace.ts](/Users/peiwang/Projects/nextbot/packages/go-usb-ai/src/cli/skills/marketplace.ts)：
  - 已存在且包含 `SKILL.md` 的目录继续视为“已安装”。
  - 已存在但仅为失败安装留下的空目录，或只包含当前 marketplace manifest 子集文件的残留目录，自动清理后重装。
  - 已存在且包含无关文件的目录，继续拒绝覆盖，并提示使用 `--force`。
- 新增 [packages/go-usb-ai/src/cli/skills/marketplace.install.test.ts](/Users/peiwang/Projects/nextbot/packages/go-usb-ai/src/cli/skills/marketplace.install.test.ts)，覆盖：
  - 空残留目录可自动恢复并完成安装。
  - 含无关文件的目录仍然拒绝覆盖。

## 测试/验证/验收方式

- 单测：`pnpm -C packages/go-usb-ai test -- --run src/cli/skills/marketplace.install.test.ts`
- 类型检查：`pnpm -C packages/go-usb-ai tsc`
- Lint：`pnpm -C packages/go-usb-ai lint`
- 构建：`pnpm -C packages/go-usb-ai build`
- 真实冒烟：
  - 执行 `go-usb-ai restart`
  - 先手工制造空残留目录：`~/.go-usb-ai/workspace/skills/agent-browser`
  - 调用 `POST /api/marketplace/skills/install`
  - 期望返回 `✓ Installed agent-browser (marketplace)`，并落盘 `SKILL.md`

## 发布/部署方式

- 本地验证版本可通过 `npm i -g /Users/peiwang/Projects/nextbot/packages/go-usb-ai` 安装到全局后直接验证。
- 正式发布时按项目既有 NPM 发布闭环执行：changeset/version/publish，并对 `go-usb-ai` marketplace 安装链路补一条线上或发布后冒烟。

## 用户/产品视角的验收步骤

- 启动或重启服务：`go-usb-ai restart`
- 打开 `go-usb-ai` UI 的 skill marketplace
- 选择一个 skill（例如 `agent-browser`）点击安装
- 若该 skill 之前失败安装过、目录残留为空目录或半成品目录，安装仍应成功，不再弹出 `Skill directory already exists ... (use --force)`
- 安装成功后，在 UI 中应显示已安装状态，且本地目录 `~/.go-usb-ai/workspace/skills/<slug>/SKILL.md` 存在
