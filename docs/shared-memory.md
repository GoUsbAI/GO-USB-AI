# GO-USB-AI 共享记忆（供 OpenHuman 读取）

> 本文件为跨 AI 智能体共享记忆标记。OpenHuman 通过 Knowledge Vault 索引后可直接搜索到。

## 项目概览

- **名称**: GO-USB-AI（代码实际是 GoUsbAi 的完整克隆）
- **源码上游**: https://github.com/Peiiii/go-usb-ai
- **定位**: U盘离线版 AI 个人操作层（AgentOS），插到任意电脑即可使用
- **代码库**: `d:/AI/GO-USB-AI`
- **仓库**: https://github.com/GoUsbAI/GO-USB-AI
- **当前内部标识**: 全部仍是 go-usb-ai（类名、包名、CLI、环境变量）
- **改名状态**: 尚未开始

## 核心特性

- 统一入口：AI 时代的个人操作层
- 12+ AI 提供商 / 10+ 消息渠道
- 内置自动化（Cron + Heartbeat）
- 本地可控，完全离线可用
- 兼容 OpenClaw 插件生态
- Electron 桌面壳 + Web UI

## 当前架构（CodeGraph 扫描）

```
Electron Shell (apps/desktop)
    ↓
GoUsbAi UI (packages/go-usb-ai-ui) · 329 TSX
    ↓
GoUsbAi Backend:
    ├── Kernel: AgentManager, ToolManager, SkillManager, ConfigManager, McpManager, NcpSessionManager
    ├── Core: SessionManager, ChannelManager
    ├── Service: CLI + Gateway
    └── NCP: Agent 运行时（NcpReplyConsumer → NcpReplySession → NcpEventDispatchBatcher）
```

技术栈: TypeScript + React + Electron, pnpm monorepo

## 路线图

- v0.1 — 基础对话 + 本地LLM
- v0.3 — 记忆树系统
- v0.5 — 代码助手 + 文档解析
- v0.7 — 邮件/日历/聊天集成
- v0.9 — 多Agent协作
- v1.0 — 完整便携AI生态

## 2026-05-25 当前状态

### 已完成
1. OpenHuman v0.54.0 安装到 `C:\Program Files\OpenHuman\`
2. 记忆后端切换为 `local`（agentmemory 暂时不可用）
3. 全部模型路由统一指向 LM Studio `agentcpm-explore`
4. GO-USB-AI vault 已添加到 OpenHuman（4,426 文件）
5. CI `windows-update-smoke` 已修复（去掉不支持的 `--timeout` 参数，#4 通过）
6. 配置目录: `C:\Users\bin\.openhuman\users\6a0d102ba2141583bab3e8ea\`

### OpenHuman 配置要点
- LM Studio: `http://localhost:1234/v1`
- 聊天模型: `agentcpm-explore`
- 嵌入向量: 云端 `embedding-v1`
- 记忆后端: `local`
- GitHub OAuth 已连接，Composio 已启用

### 待完成
1. 项目命名决选
2. 其余 7 个 GitHub 仓库测试
3. GO-USB-AI v0.19 修复
4. agentmemory 配置 LLM/嵌入后重新启用

---

## BinClaw 项目教训（D:\BinClaw）

### 真相
BinClaw 是 GoUsbAi 的桌面打包版。做了 4 次改名（nanobot→nextbot→go-usb-ai→GoUsbAi→BinClaw），但**只改了壳层**（exe 名、窗口标题），代码中的包名仍是 `@go-usb-ai/*`、CLI 仍是 `go-usb-ai`、环境变量存在 `GOUSB_AI_HOME` 和 `BINCLAW_HOME` 两个并存。

### 核心教训（不允许在 GO-USB-AI 重现）
1. **全栈同步改名**，不能只改壳
2. **只设一个环境变量前缀**，不保留旧名兼容
3. **第一天就集中品牌配置**（brand.ts）
4. **不留兼容 shim**（BinClaw 的旧名兼容代码永远删不掉）
5. **AGENTS.md 不要过度膨胀**（BinClaw 涨到 122KB）
6. **严格模块边界**（防止 God Class 和目录腐化）

### 关键文件
- `D:\BinClaw\BinClaw 改进方案.md`
- `D:\BinClaw\binclaw 配置文件的修改.md`
- `D:\BinClaw\binclaw UI 配置文件详解.md`
- `D:\BinClaw\AGENTS.md` (122KB 过度膨胀案例)
- `D:\BinClaw\docs\VISION.md`

---

## GO-USB-AI 修改方案

详见 `GO-USB-AI 修改方案.md`（同级目录）

### CodeGraph 图谱扫描结果
- 31,741 节点 / 75,515 边 / 2,178 文件
- go-usb-ai 全局替换涉及：7,493 条 import、~15 个 npm 包、50+ 类名、~15 个目录
- 架构分层：Electron → UI(329 TSX) → Backend(Kernel/Core/Service/NCP)

### 图谱工具评估
- **CodeGraph**: ✅ 唯一可用，纯本地 SQLite，30K+ 节点
- **Graphify**: ❌ 已删除（LM Studio 超时不可用）
- **Understand-Anything**: ❌ 已删除（纯 AI 插件无 CLI）
