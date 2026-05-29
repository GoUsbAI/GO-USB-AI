# GO-USB-AI 修改方案

> 基于 CodeGraph 图谱分析 + BinClaw 项目教训 · 2026-05-25

---

## 零、项目真相

**GO-USB-AI 是 [GoUsbAi](https://github.com/Peiiii/go-usb-ai) 的完整克隆**——不是"基于"、不是"fork"，就是原样 git clone 下来的同一个项目，用了 `GoUsbAI/GO-USB-AI` 作仓库名。

这正是 BinClaw `D:\BinClaw` 犯过的错误的**加强版**：BinClaw 只是把桌面 exe 名改成 "BinClaw Desktop"，代码里一切还是 `@go-usb-ai/*`。GO-USB-AI 更是连产品壳层都没改——仓库名叫 GO-USB-AI，里面全是 go-usb-ai。

## 一、BinClaw 的血泪教训（核心参考）

### 1.1 命名演变的 5 次痛苦

| 阶段 | 名称 | 问题 |
|------|------|------|
| 1 | nanobot (Python) | 初始名 |
| 2 | nextbot (TS 迁移) | 全量重写，3600+ 行 God Class |
| 3 | go-usb-ai (首次改名) | `~/.nextbot` → `~/.go-usb-ai`，留了兼容 shim |
| 4 | GoUsbAi (品牌化) | 散落的品牌配置，到 v0.1.1 才建 brand.ts |
| 5 | BinClaw (你的 fork) | **只在壳层改名**，代码/包名/npm 全是 go-usb-ai |

### 1.2 BinClaw 当前的身份分裂

| 层面 | 名字 | 状态 |
|------|------|------|
| 根目录 | `D:\BinClaw` | BinClaw |
| npm workspace | `go-usb-ai-workspace` | go-usb-ai |
| npm 包名 | `@go-usb-ai/*` | go-usb-ai |
| CLI 命令 | `go-usb-ai` | go-usb-ai |
| 桌面 exe | `BinClaw Desktop.exe` | BinClaw |
| 窗口标题 | `小斌AI文员` | 定制 |
| 环境变量 | `GOUSB_AI_HOME` + `BINCLAW_HOME` | **两个并存** |
| 文档域名 | `docs.go-usb-ai.io` | go-usb-ai |
| AGENTS.md | 122 KB | 已经过度膨胀 |

**核心诊断**：BinClaw 做了一个"换皮式"重命名——只在产品壳层（exe 名、窗口标题、启动脚本）标注 BinClaw，所有代码基础设施、npm 生态、CLI、域名全部还是 GoUsbAi。

### 1.3 不允许在 GO-USB-AI 重现的错误

| 错误 | BinClaw 遭遇 | 对 GO-USB-AI 的约束 |
|------|-------------|-------------------|
| 壳层改名 | exe/窗口改了，代码没改 | **必须全栈同步** |
| 多套环境变量 | GOUSB_AI_HOME + BINCLAW_HOME | **只设一个前缀，永不兼容旧名** |
| 品牌名散落 | 后期才建 brand.ts | **第一天就集中配置** |
| 兼容 shim | 每次留旧名兼容，永远删不掉 | **不保留任何旧名引用** |
| 目录腐化 | commands/runtime 混了 8 种 owner | **严格模块边界** |
| AGENTS.md 膨胀 | 122 KB | **精简为必要内核** |
| 品牌文案散落 | 改 slogan 要动 5 个文件 | **文档统一管理** |

## 二、CodeGraph 扫描结果（当前代码现状）

### 2.1 核心指标

| 指标 | 数值 |
|------|------|
| 文件 | 2,178 |
| 节点 | 30,741 |
| 边 | 75,515 |
| 函数 | 8,343 |
| 类 | 587 |
| 路由 | 149 |
| TSX 组件 | 329 |

### 2.2 架构分层

```
Electron Shell (apps/desktop)
    ↓
GoUsbAi UI (packages/go-usb-ai-ui) · 329 TSX
    ↓
GoUsbAi Backend
    ├── Kernel: AgentManager, ToolManager, SkillManager, ConfigManager, McpManager, NcpSessionManager
    ├── Core: SessionManager, ChannelManager
    ├── Service: CLI + Gateway (GoUsbAiGatewayRuntime → GoUsbAiApp)
    └── NCP: NcpReplyConsumer → NcpReplySession → NcpEventDispatchBatcher
```

### 2.3 需要全局替换的 go-usb-ai 出现位置

| 类别 | 预估数量 | 示例 |
|------|---------|------|
| import 路径 | 7,493 | `from '@go-usb-ai/kernel'` |
| npm scope | ~15 个包 | `@go-usb-ai/kernel`, `@go-usb-ai/ui` |
| 类名 | 50+ | `GoUsbAiKernel`, `GoUsbAiClient`, `GoUsbAiGatewayRuntime` |
| 类型名 | 50+ | `GoUsbAiTransport`, `GoUsbAiAppKernel` |
| 函数/变量 | 100+ | `go-usb-aiBin`, `go-usb-ai-*` 命名 |
| 目录名 | ~15 | `packages/go-usb-ai-kernel/` |
| 环境变量 | 多处 | `GOUSB_AI_HOME` |
| 配置文件 | ~10 | `default-config.json`, workspace config |
| CLI 命令名 | 1 | `go-usb-ai` 二进制 |
| docs/ 引用 | 1,499+ | logs 里的 go-usb-ai 引用 |

## 三、修改方案

### 3.1 前置决策

| 决策项 | 推荐 | 理由 |
|--------|------|------|
| 新名称 | **GO-USB-AI** (保持一致) | 仓库已叫这个名字，减少认知混乱 |
| 新 npm scope | `@go-usb-ai` | 与仓库名统一 |
| CLI 命令名 | `gousb` 或 `go-usb-ai` | 简短、不与现有冲突 |
| 环境变量前缀 | `GOUSB_HOME` | 唯一，不留旧名兼容 |
| 数据目录 | `~/.gousb` | 干净起点 |
| 桌面应用名 | `GO-USB-AI` | 与仓库一致 |
| 是否需要 npm 发布 | **不需要** | U 盘离线分发，跳过整个 npm 生态链 |

### 3.2 分批执行计划

#### 第一批：命名基础设施（先做，影响所有后续）

```
1. 建立 brand.ts 或 brand.config.ts → 集中所有品牌常量
   - PRODUCT_NAME = "GO-USB-AI"
   - CLI_BIN = "gousb"
   - ENV_PREFIX = "GOUSB"
   - DATA_DIR = ".gousb"
   - NPM_SCOPE = "@go-usb-ai"

2. 环境变量：GOUSB_AI_HOME → GOUSB_HOME（不保留兼容）
3. 数据目录：~/.go-usb-ai → ~/.gousb
```

#### 第二批：代码全量替换（机械操作，ripgrep + sed）

```
替换规则（严格区分大小写）：

模式 A: go-usb-ai → gousb (小写全词)
  - 目录名: packages/go-usb-ai-kernel/ → packages/gousb-kernel/
  - 包名: @go-usb-ai/kernel → @go-usb-ai/kernel
  - CLI: go-usb-ai → gousb
  - 文件名: go-usb-ai-*.ts → gousb-*.ts

模式 B: GoUsbAi → Gousb (首字母大写类名)
  - go-usb-ai-kernel 类: GoUsbAiKernel → GousbKernel
  - 类型: GoUsbAiAppKernel → GousbAppKernel

模式 C: GoUsbAi → GoUsb (驼峰类名)
  - GoUsbAiClient → GoUsbClient
  - GoUsbAiTransport → GoUsbTransport

模式 D: GOUSB_AI → GOUSB (全大写常量/环境变量)
  - GOUSB_AI_HOME → GOUSB_HOME
```

#### 第三批：配置与文档

```
3.1 package.json
  - workspace name: go-usb-ai-workspace → gousb-workspace
  - 所有包的 name 字段
  - 所有包的相互依赖路径

3.2 配置文件
  - default-config.json 中的所有 go-usb-ai 引用
  - desktop 配置中的 productName, appId

3.3 docs/
  - 简化：删除 logs/ (1,499 个旧日志)
  - 保留：VISION.md, ARCHITECTURE.md, USAGE.md
  - 更新其中所有 go-usb-ai 引用
  - 删除 marketing/ (与 GO-USB-AI 无关)
  - 删除 npm-readmes/ (不发 npm)
```

#### 第四批：CI/Workflow 适配

```
4.1 .github/workflows/*.yml → 更新所有 go-usb-ai 引用
4.2 如果不发布 npm → 删除 npm 发布相关 workflow
4.3 简化 CI 为仅 build + lint + smoke
```

### 3.3 不需要做的事

| 项目 | 理由 |
|------|------|
| npm publish | U 盘离线分发 |
| 更新 npm registry | 不发布 |
| 保留旧名兼容 | BinClaw 教训：shim 永远删不掉 |
| 保留 docs/logs 的 1499 个日志 | 旧项目的迭代记录，新项目不需要 |
| 保留 marketing/ 文档 | GO-USB-AI 不需要这些 |
| 保留 OpenClaw 兼容层 | 独立产品，不做兼容 |

### 3.4 风险清单

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 替换遗漏 | 中 | 编译报错 | ripgrep 全局扫描 + tsc 验证 |
| 目录重命名后路径引用断裂 | 中 | 编译/运行报错 | 先改目录再替换内部引用 |
| 硬编码的字符串 go-usb-ai | 高 | 运行时异常 | 全量文本扫描，不依赖正则 |
| pnpm workspace 链接断裂 | 中 | 安装失败 | 改完后 pnpm install 重新链接 |
| 桌面应用打包配置遗漏 | 低 | 打包出错 | 参考 BinClaw 的打包文档 |

## 四、执行记录

### 4.1 第一步：全量命名替换 ✅

> 执行日期：2026-05-25

**范围**：`nextclaw` → `go-usb-ai`（5 种大小写变体，目录 + 文件名 + 文件内容）

| 替换映射 | 示例 |
|----------|------|
| `nextclaw` → `go-usb-ai` | 目录名、包名、npm scope、CLI 命令 |
| `Nextclaw` → `GoUsbAi` | 类型名、文档标题 |
| `NextClaw` → `GoUsbAi` | 类名、组件名 |
| `nextClaw` → `goUsbAi` | 驼峰变量/属性名 |
| `NEXTCLAW` → `GOUSB_AI` | 环境变量、常量 |

**成果**：
- 目录改名：127 个
- 文件改名：87 个
- 文件内容修改：3,083 个
- 图片资源改名：44 个 PNG/JPG
- 最终扫描：源码层 0 残留 `nextclaw`

---

### 4.2 第二步：U 盘离线版模块删除 + 源码引用清理 ✅

> 执行日期：2026-05-25

#### 目标

删除所有云端/远程/多平台/CI/CD 相关模块，保留 U 盘离线独立运行所需的核心能力。

#### 保留原则

- 用户明确要求：**保留 MCP 平台**、**只保留微信频道扩展**
- 最终目标：打包成 EXE → **保留 Electron 桌面壳**
- 核心 AI 对话（NCP 协议栈 5 个包）→ 完整保留

#### 删除清单（7 批次，共 7 批次约 280 文件）

**第 1 批 — 云平台应用（6 个）**

| 删除 | 说明 |
|------|------|
| `apps/platform-console` | 平台控制台 Web 应用 |
| `apps/platform-admin` | 平台管理后台 |
| `apps/competitive-leaderboard` | 竞技排行榜 |
| `apps/maintainability-console` | 可维护性控制台 |
| `apps/public-roadmap-feedback-portal` | 公开路线图反馈门户 |
| `apps/go-usb-ai-apps-web` | Apps Web 入口 |

**第 2 批 — 频道扩展（9 个，保留 1 个）**

| 删除 | 说明 |
|------|------|
| `packages/extensions/go-usb-ai-channel-extension-dingtalk` | 钉钉 |
| `packages/extensions/go-usb-ai-channel-extension-discord` | Discord |
| `packages/extensions/go-usb-ai-channel-extension-email` | 邮件 |
| `packages/extensions/go-usb-ai-channel-extension-feishu` | 飞书 |
| `packages/extensions/go-usb-ai-channel-extension-qq` | QQ |
| `packages/extensions/go-usb-ai-channel-extension-slack` | Slack |
| `packages/extensions/go-usb-ai-channel-extension-telegram` | Telegram |
| `packages/extensions/go-usb-ai-channel-extension-wecom` | 企业微信 |
| `packages/extensions/go-usb-ai-channel-extension-whatsapp` | WhatsApp |

✅ **保留**：`packages/extensions/go-usb-ai-channel-extension-weixin`（微信）

**第 3 批 — 远程/云模块（4 个）**

| 删除 | 说明 |
|------|------|
| `packages/go-usb-ai-remote` | 远程访问独立包 |
| `packages/go-usb-ai-app-runtime` | App 运行时 |
| `packages/go-usb-ai-app-sdk` | App SDK |
| `packages/go-usb-ai-openclaw-compat` | OpenClaw 兼容层 |

**第 4 批 — NCP 适配器（8 个，1 个恢复）**

| 删除 | 说明 |
|------|------|
| `packages/ncp-packages/go-usb-ai-ncp-runtime-http-client` | NCP HTTP 客户端适配器 |
| `packages/ncp-packages/go-usb-ai-ncp-runtime-stdio-client` | NCP Stdio 客户端适配器 |
| `packages/ncp-packages/go-usb-ai-ncp-runtime-adapter-hermes-http` | Hermes ACP 桥接适配器 |
| `packages/ncp-packages/go-usb-ai-hermes-acp-bridge` | Hermes ACP 桥 |
| `packages/ncp-packages/go-usb-ai-narp-stdio-runtime-wrapper` | NARP Stdio 运行时包装 |
| `packages/ncp-packages/go-usb-ai-narp-runtime-*` (2 个) | NARP 运行时 SDK 启动器 |
| `packages/ncp-packages/go-usb-ai-ncp-runtime-*` (2 个) | NCP 运行时 SDK 适配器 |
| `packages/ncp-packages/go-usb-ai-ncp-agent-runtime-next` | NCP Agent 运行时 vNext |

> ⚠️ **复盘：`ncp-mcp` 最初被误删的原因**
>
> `ncp-mcp` 被归入"第 4 批 NCP 适配器"一同删除，但它在功能定位上与其余 8 个包**完全不同**：
>
> ```
> 第 4 批删掉的其余 8 个包：传输层适配器
>   作用：让 NCP 协议通过 HTTP/Stdio 等传输方式连接外部运行时
>   结论：U 盘离线版不需要外部运行时，应删
>
> ncp-mcp：功能层桥接（非传输！）
>   作用：将 MCP 服务器发现的工具，注册为 NCP Agent 可调用的工具
>   架构位置：
>     MCP 服务器 ──工具列表──▶ ncp-mcp 桥 ──NCP 工具──▶ Agent 发现/调用
>     go-usb-ai-mcp（保留）      go-usb-ai-ncp-mcp      NCP 协议栈
>     启动和管理 MCP 服务器     工具→NCP工具适配        对话/工具调用
>   结论：删了它，MCP 服务器能启动，但 Agent 看不到任何工具，等于 MCP 废了一半
> ```
>
> **教训**：命名相近不等于功能相近。`ncp-mcp` 是 MCP→NCP 的功能桥，不是 NCP→外部运行时的传输适配器。
> 批次分组时应按**语义角色**归类，不能仅凭路径位置（`ncp-packages/`）一刀切。
> 已从 git 恢复该包并重命名至 `go-usb-ai-ncp-mcp`。

**第 5 批 — 独立应用（2 个）**

| 删除 | 说明 |
|------|------|
| `apps/companion` | Companion 桌面伴侣应用 |
| `apps/fnos-go-usb-ai` | FNOS 集成应用 |

**第 6 批 — WhatsApp 桥接**

| 删除 | 说明 |
|------|------|
| `bridge/` | WhatsApp 桥接服务（独立于微信频道扩展，互不影响） |

**第 7 批 — 发布/CI/CD/文档站**

| 删除 | 说明 |
|------|------|
| `scripts/release/` | NPM 发布脚本 |
| `scripts/docs/` | 文档生成脚本 |
| `scripts/fnos/` | FNOS 部署脚本 |
| `scripts/platform/` | 平台运维脚本 |
| `scripts/deploy/` | 部署脚本 |
| `scripts/metrics/` | 指标采集脚本 |
| `scripts/project-pulse/` | 项目脉冲脚本 |
| `apps/docs/` | 文档站点应用 |
| `workers/` | Cloudflare Workers（marketplace-api + provider-gateway-api） |

#### 源码引用清理

删除模块后，保留包中存在大量对已删除包的 import 引用，进行了系统性清理：

| 受影响包 | 清理操作 | 文件数 |
|----------|---------|--------|
| `go-usb-ai-kernel` | 删除 narp-runtime feature、移除 companion 钩子、精简频道扩展清单、修复 ncp-agent-runtime-next 引用 | 6 |
| `go-usb-ai-service` | 删除 companion 子系统（2 文件）、移除 RemoteRuntimeActions/openclaw-compat 引用 | 5 |
| `go-usb-ai-server` | 清理 openclaw-compat 依赖 | 2 |
| `go-usb-ai` (CLI) | 清理 tsdown 打包配置中的 remote 引用 | 1 |
| `package.json` × 4 | 清理 30+ 已删包的工作空间依赖声明 | 4 |

**清理方式**：
- 删除无法编译的 import 语句
- 删除使用已删包的代码段（如 `setPluginRuntimeBridge()`、`companionRuntimeService` 等）
- 对仅使用已删包**类型**的场景，在本地重新定义相同类型接口
- 精简 `BUILTIN_EXTENSION_PACKAGES` 为仅 `weixin`

#### 最终项目结构

```
apps/          (3)  desktop, examples, landing
packages/      (13) go-usb-ai, agent-chat, agent-chat-ui, client-sdk,
                     core, extension-sdk, kernel, mcp, runtime,
                     server, service, shared, ui
extensions/    (1)  go-usb-ai-channel-extension-weixin
ncp-packages/  (6)  ncp, ncp-agent-runtime, ncp-mcp, ncp-react,
                     ncp-react-ui, ncp-toolkit
```

#### CodeGraph 验证

| 指标 | 删除前 | 删除后 |
|------|--------|--------|
| 文件 | 504 | 226 |
| 节点 | 6,391 | 2,973 |
| 边 | — | 6,173 |
| 状态 | — | 索引最新 ✅ |

#### 保留的核心能力

| 能力 | 状态 |
|------|------|
| AI Agent 对话（NCP 协议栈 5 包） | ✅ |
| MCP 工具平台（mcp + ncp-mcp 桥） | ✅ |
| 微信频道扩展 | ✅ |
| Electron 桌面壳 | ✅ |
| Agent / 技能管理 | ✅ |
| 本地会话管理 | ✅ |
| 定时任务 | ✅ |
| 多模型配置 | ✅ |

---

### 4.3 第三步：残留引用清理 — openclaw-compat + remote 彻底清零 ✅

> 执行日期：2026-05-25
> 承接上一个会话未完成的安装/部署任务，从上次中断步骤继续执行。

#### 背景

第二步（模块删除）完成后，仍残留 **38+2 个文件** 对已删除包的引用：
- `@go-usb-ai/openclaw-compat` — 12 个文件
- `@go-usb-ai/remote` / RemoteServiceModule — 12 个文件
- `@go-usb-ai/runtime` BUILTIN_CHANNEL_IDS — 14 个文件

#### 操作分类汇总

| 类别 | 数量 | 处理方式 |
|------|------|---------|
| 整目录删除 | 1 | `commands/remote/` 目录（USB 离线不需要远程功能） |
| 整文件删除 | 3 | `dev-plugin-overrides.utils.ts` + 测试 + `dev-plugin-overrides.utils.test.ts` |
| 替换为本地 stub | 6 | `service-remote-runtime.utils.ts`、`service-remote-access.service.ts`、`gateway-remote.manager.ts`、`ExtensionPluginRegistryService`、`marketplace-installed.utils.ts` |
| import 路径替换 | ~25 | `@go-usb-ai/openclaw-compat` → `@go-usb-ai/kernel` |
| 类型本地化 | 1 | `extension-runtime.types.ts` 新增 8 个类型定义替代 openclaw-compat |
| 函数本地化 | 4 | `extension.manager.ts` 新增 `toPluginConfigView`/`mergePluginConfigView`/`enablePluginInConfig` |
| 精简 BUILTIN_CHANNELS | 1 | `builtin-channel.config.ts` 从 10 个缩减为仅 `["weixin"]` |
| 测试 mock 更新 | 8 | 移除 openclaw-compat mock，更新频道断言为 weixin-only |

#### Server 层修复

| 文件 | 操作 |
|------|------|
| `plugin-channel-config-projection.utils.ts` | 替换 import |
| `channel-auth.utils.ts` | 本地定义类型，移除重复 import |
| `router-options.types.ts` | 替换 import |
| `marketplace-installed.utils.ts` | 替换为本地 stub + ExtensionPluginRegistryService 本地定义 |
| `config-commands.service.ts` | 移除 openclaw-compat 引用 |
| `plugin-command.utils.ts` | 替换 import |
| `service-bootstrap-status.service.ts` | 替换为本地 stub |

#### Remote 模块清理

| 操作 | 文件 |
|------|------|
| 整目录删除 | `packages/go-usb-ai-service/src/commands/remote/` |
| 替换为 no-op | `gateway-remote.manager.ts` |
| 替换为 stub | `service-remote-runtime.utils.ts`、`service-remote-access.service.ts` |
| import 修复 | `cli.types.ts`、`managed-service-state.store.ts`、`local-ui-runtime.store.ts` |
| CLI app 清理 | `packages/go-usb-ai/src/cli/app/index.ts` 移除 remote 子系统注册 |

#### 测试文件修复

| 文件 | 操作 |
|------|------|
| `channel-config-view.test.ts` | 替换 import |
| `channels.test.ts` | 移除 openclaw-compat mock，更新断言为 weixin-only |
| `extension.manager.test.ts` | 替换 import，移除 mock |
| `gateway-plugin-manager.service.test.ts` | 替换 import，更新 mock |
| `config-commands.service.test.ts` | 替换 import |
| `server.weixin-channel.test.ts` | 替换 import |
| `router.weixin-channel-config.test.ts` | 替换 import |
| `router.weixin-channel-auth.test.ts` | 替换 import |
| `extension-runtime.service.test.ts` | 移除已删频道 ID 引用 |
| `builtin-channels.test.ts` | 更新为 weixin-only |
| `agent-runtime-registry.service.test.ts` | 更新 mock |

#### 验证结果

| 检查项 | 结果 |
|--------|------|
| `@go-usb-ai/openclaw-compat` 引用 | 0 文件 ✅ |
| `@go-usb-ai/remote` 引用 | 0 文件（仅 stub 自身类型定义）✅ |
| 已删 channel extension 包引用 | 0 文件 ✅ |
| `BUILTIN_CHANNEL_IDS` | 仅保留 `["weixin"]` ✅ |

#### 关键架构决策

| 决策 | 说明 |
|------|------|
| openclaw-compat 完全移除 | 所有 17 个运行时函数 + 8 个核心类型已在 kernel 内部重新定义 |
| 远程模块完全禁用 | `commands/remote/` 整个删除，`gateway-remote.manager.ts` 变为 no-op |
| Plugin 系统简化 | `ExtensionPluginRegistryService` 返回空注册表，channel 发现完全依赖 extension manifest 系统（仅微信） |
| NPM 安装禁用 | `installPluginMutation` 对非 link 模式抛错（"NPM plugin installation is not supported in USB offline mode"） |

---

### 4.4 第四步：tsc 编译验证 + 标识符修复（进行中）

> 执行日期：2026-05-25
> 状态：18/20 包编译通过，service + server 包仍有 74 个类型错误

#### 依赖安装

| 步骤 | 结果 |
|------|------|
| `pnpm install` | ✅ 成功（修复了 apps/desktop、go-usb-ai-core、go-usb-ai-ui 的 package.json 中缺失的 workspace 依赖） |
| `pnpm uninstall` + 清理 | ✅ 所有 node_modules 已清除 |

#### tsc 编译修复记录

**已修复的错误类型**：

| 错误类型 | 修复方式 | 文件数 |
|----------|---------|--------|
| `go-usb-ai` 属性名（含连字符 `-`）在代码中作为标识符 | 批量替换为 `goUsbAi` 驼峰命名 | 100+ 文件（ui 包批量替换） |
| 对象属性 `providers.go-usb-ai` 访问 | 改为 `providers["go-usb-ai"]` | 10+ 文件 |
| 类型注解中未加引号的 `go-usb-ai:` 属性 | 改为 `"go-usb-ai":` | 批量修复 |
| template literal 中未转义的引号 | 改用单引号包裹 | 1 文件 |
| `@go-usb-ai/feishu-core` 包缺失 | 替换为本地 stub 类型定义 | feishu-probe.ts + schema.ts |
| `undici.Response` vs DOM `Response` 类型冲突 | 显式导入 `UndiciResponse` 类型 | web.tools.ts + mcp-client-factory.ts |
| tsconfig `moduleResolution: "NodeNext"` 不支持 paths 映射 | 改为 `bundler` + 显式 module | shared/core/mcp/runtime/ncp-react/ncp-react-ui/server/service |

**tsconfig 修复清单**（改为 bundler resolution + 完整 paths 映射）：

| 包 | 修改 |
|---|------|
| `go-usb-ai-shared` | 独立 tsconfig，bundler + ncp paths |
| `go-usb-ai-core` | bundler + @core/* + ncp paths |
| `go-usb-ai-mcp` | bundler + core/shared/ncp paths |
| `go-usb-ai-runtime` | bundler + core/shared/ncp paths |
| `go-usb-ai-server` | bundler + core/kernel/shared/ncp/runtime/mcp paths |
| `go-usb-ai-service` | bundler + core/kernel/server/shared/ncp/mcp/ncp-agent-runtime paths |
| `ncp-react` | bundler + ncp/ncp-toolkit/shared paths |
| `ncp-react-ui` | bundler + ncp/ncp-react/shared paths |

**当前状态**：

| 包 | tsc 状态 |
|---|---------|
| shared | ✅ 通过 |
| core | ✅ 通过 |
| mcp | ✅ 通过 |
| ncp | ✅ 通过 |
| ncp-toolkit | ✅ 通过 |
| ncp-agent-runtime | ✅ 通过 |
| ncp-react | ✅ 通过 |
| ncp-react-ui | ✅ 通过 |
| runtime | ✅ 通过 |
| agent-chat | ✅ 通过 |
| channel-extension-weixin | ✅ 通过 |
| client-sdk | ✅ 通过 |
| extension-sdk | ✅ 通过 |
| agent-chat-ui | ✅ 通过 |
| desktop | ✅ 通过 |
| go-usb-ai (CLI) | ✅ 通过 |
| **server** | ❌ 7 个错误（类型不匹配、stub 接口不完整） |
| **service** | ❌ 67 个错误（类型链式不匹配、stub 依赖复杂） |

#### 根因分析

**架构问题**：项目的 monorepo 使用 tsconfig paths 映射引用其他包的源码，而非通过 node_modules workspace 链接。当 service 编译时，它解析 kernel 源码，而 kernel 内部又引用 ncp-agent-runtime 等包，形成无限递归的别名依赖链。

**技术债务**：
1. stub 文件（6 个）类型定义过于简化，实际调用方期望更丰富的接口
2. 每个包的 tsconfig 需要复制所有间接依赖的 paths 映射
3. 类型妥协（为编译通过而修改签名）可能引发运行时错误

**建议后续方案**：
- 短期：标记 74 个错误为已知限制，验证核心功能（微信 + AI 聊天）
- 中期：改用标准 workspace 链接 + exports，不直接用 paths 引用源码
- 长期：建立统一类型定义包（`@go-usb-ai/types`）

---

## 五、与 BinClaw 的关键区别

| 对比维度 | BinClaw（你之前的做法） | GO-USB-AI（本次方案） |
|----------|------------------------|---------------------|
| 命名范围 | 只改壳层 | 全栈同步 |
| npm scope | 保留 @go-usb-ai | 改成自有 scope |
| 环境变量 | GOUSB_AI_HOME + BINCLAW_HOME 并存 | 唯一 GOUSB_HOME |
| CLI 命令 | 保留 go-usb-ai | 改为 gousb |
| 兼容 shim | 留了好几层 | 不留 |
| 品牌配置 | 后期才加 brand.ts | 第一天就集中 |
| 文档状态 | 保留全部旧日志 | 精简，只留必要的 |
| 与上游关系 | 试图向上游贡献 | 独立发展 |

## 六、执行检查清单

- [x] ~~建立 brand.config.ts 集中配置~~（第二步已跳过，使用 go-usb-ai 命名）
- [x] 第一步：全量命名替换（nextclaw → go-usb-ai，5 种大小写）
- [x] 第二步：模块删除（7 批，~280 文件）
- [x] 第二步：源码引用清理（18 文件修复 + 4 个 package.json）
- [x] 第二步：恢复 ncp-mcp 包（MCP 功能必需）
- [x] 第三步：残留引用清理（38+2 文件，openclaw-compat/remote 彻底清零）
- [x] CodeGraph 索引同步验证
- [ ] `pnpm install` 安装依赖
- [ ] `tsc --noEmit` 全量编译验证
- [ ] 桌面应用打包冒烟
