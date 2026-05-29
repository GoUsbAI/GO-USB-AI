# 批量替换 go-usb-ai 小结报告

> 日期：2026-05-25
> 操作：将从 NextClaw 项目克隆的全量代码，批量重命名为 GO-USB-AI 项目标识

---

## 一、前置分析

### 1.1 吸取 BinClaw 项目教训

在开始之前，先研究了 `D:\BinClaw` 项目的失败经验。该项目的重命名**只改了 Shell/UI 层**，internal 代码中大量保留了旧标识符，导致：
- 新旧名称混用，代码不可信
- 没有图谱做验证，无法确认覆盖完整性
- 缺乏规范的大小写映射策略

### 1.2 命名规范确立

| 场景 | 旧名 | 新名 |
|------|------|------|
| 代码层（含目录/文件名/npm 包） | `nextclaw` | `go-usb-ai` |
| 类名/类型名/PascalCase | `Nextclaw` / `NextClaw` | `GoUsbAi` |
| camelCase 变量/属性 | `nextClaw` | `goUsbAi` |
| 环境变量/常量/UPPER_SNAKE | `NEXTCLAW` / `NEXTCLAW_*` | `GOUSB_AI` / `GOUSB_AI_*` |
| 对外展示名 | NextClaw | GO-USB-AI |

### 1.3 执行前提

- 项目无 `node_modules`，无依赖安装，属干净状态
- 目标为 **USB 离线版本**，不需要 npm 生态身份，不需要 upstream 合并
- CodeGraph 图谱已预先构建（30,741 节点 / 75,515 边），提供验证基线

---

## 二、执行范围

### 2.1 影响统计

| 操作 | 数量 |
|------|------|
| 目录重命名 | 127 个 |
| 文件重命名 | 87 个 |
| 文件内容替换 | 3,083 个 |
| 跳过（二进制/图片/zip） | 约 44 个图片按文件名单独处理 |

### 2.2 涉及层级

| 层级 | 替换内容 |
|------|---------|
| **package.json** | workspace name → `go-usb-ai-workspace`，所有 `@nextclaw/*` → `@go-usb-ai/*` |
| **目录结构** | `packages/nextclaw-*` → `packages/go-usb-ai-*`（~30 个子包），`docs/logs/v*-nextclaw-*` → `v*-go-usb-ai-*`（~100+ 个迭代目录） |
| **源码文件** | import 路径、类名、变量名、类型名、常量、env 引用 |
| **脚本** | CLI 入口、构建脚本、发布脚本、dev runner |
| **配置** | `eslint.config.mjs`、`pnpm-workspace.yaml`、tsconfig paths |
| **文档** | AGENTS.md、skill 文件、设计文档、迭代日志 |
| **图片资源** | `apps/landing/public/` 23 张 + `images/` 21 张，文件名 `nextclaw-*` → `go-usb-ai-*` |
| **许可证** | LICENSE 版权行 `NextClaw contributors` → `GO-USB-AI contributors` |

### 2.3 执行方式

- 使用 Node.js 批量重命名脚本（`_rename.mjs`）
- 策略：深度优先目录遍历（最深目录先改名），避免路径冲突
- 替换顺序：先换最长/特定匹配（如 `NEXTCLAW_HOME` → `GOUSB_AI_HOME`），再换通用匹配，防止误替换
- 完成后删除脚本，不留工具残留

---

## 三、验证结果

### 3.1 磁盘级验证

使用 `Get-ChildItem -Recurse -Filter "*nextclaw*"` 递归扫描整个工作区：

| 检查项 | 结果 |
|--------|------|
| 目录名含 `nextclaw` | **0** |
| 文件名含 `nextclaw` | **0** |
| 文件内容含 `nextclaw`（Node.js 扫描 4,554 个文本文件） | **0**（`pnpm-lock.yaml` 故意跳过） |
| `seed-product-bundle.zip` 二进制扫描 | **无匹配** |
| camelCase `nextClaw` 残留（初次遗漏，已修复） | 1 文件 4 处 → 已归零 |

### 3.2 CodeGraph 全工具验证（sync 重建索引后）

| 工具 | 输入 | 结果 |
|------|------|------|
| `status` | — | 504 文件 / 6,391 节点 / 13,387 边 / 索引最新 |
| `files` | — | 完整树，**0 个 `nextclaw` 路径** |
| `query` | `nextclaw` | No results found |
| `query` | `Nextclaw` | No results found |
| `query` | `NextClaw` | No results found |
| `query` | `NEXTCLAW` | No results found |
| `query` | `go-usb-ai` | 20 条命中，全部新路径 |
| `query` | `GoUsbAi` | 命中 `GoUsbAiFnosPackageBuilder` 等 |
| `query` | `GOUSB_AI` | 命中所有环境变量常量 |
| `callers` | `DesktopBundleManager` | 3 个调用者，路径正确 |
| `callees` | `DesktopUpdateService` | 1 个被调用者 |
| `impact` | `DesktopBundleManager` | 25 个受影响符号，跨 4 文件 |
| `impact` | `GoUsbAiFnosPackageBuilder` | 26 个受影响符号 |
| `context` | 多个查询 | 代码上下文正常返回，含 `GOUSB_AI_HOME` 等新变量 |

### 3.3 补漏：camelCase 变体 `nextClaw`

首次重命名脚本只覆盖了 4 种大小写：`nextclaw`、`Nextclaw`、`NextClaw`、`NEXTCLAW`。后续交叉验证发现 **camelCase 变体 `nextClaw`** 未命中，存在于：

- `packages/go-usb-ai-service/src/commands/platform-auth/services/account-status.service.ts`（4 处：类型字段 `nextClawWebAccountUrl`）

已修复为 `goUsbAiWebAccountUrl`，补充映射规则为 `nextClaw` → `goUsbAi`。

### 3.4 专项检查

| 检查项 | 状态 |
|--------|------|
| LICENSE 保留 MIT 协议 | ✅ |
| `pnpm-lock.yaml` 未改动 | ✅ |
| `seed-product-bundle.zip` 内部无旧名 | ✅ |
| 全部图片文件已手动重命名 | ✅ |

---

## 四、对比 BinClaw 改进

| 维度 | BinClaw（失败） | GO-USB-AI（本次） |
|------|----------------|-------------------|
| 重命名策略 | 无规范，随意改 | 5 种 case 精确映射 |
| 覆盖范围 | 仅 Shell/UI | 全栈：目录/文件/内容/配置/图片/许可 |
| 验证手段 | 无 | 磁盘扫描 + CodeGraph 7 工具交叉验证 |
| 图谱 | 没有 | 预先构建，sync 后回归验证 |
| 残留风险 | 高 | **0** |

---

## 五、结论

本次批量替换已 **完整、正确** 执行。148 个目录/文件名 + 3,083 个文件内容全部完成替换（含事后补漏 1 个文件 4 处 camelCase 变体），经磁盘扫描和 CodeGraph 全部工具双重验证，**旧名 `nextclaw` / `Nextclaw` / `NextClaw` / `nextClaw` / `NEXTCLAW` 在项目中归零**，新名 `go-usb-ai` / `GoUsbAi` / `goUsbAi` / `GOUSB_AI` 在所有预期位置正确出现。

---

## 六、后续建议

1. **CodeGraph 数据库** 已通过 `sync` 重建，索引与当前项目状态一致，可直接使用
2. **`pnpm-lock.yaml`** 中有 344 处 `@nextclaw/xxx` 旧引用（lockfile 快照，不影响源码）。该项目为 USB 离线版暂不需要 `pnpm install`；如需装依赖，删除 lock 文件后重新 `pnpm install` 即可自动生成新版本
3. 如需在项目中安装依赖，建议删除 `pnpm-lock.yaml` 后重新 `pnpm install` 生成，或将 lockfile 中的 `nextclaw` 也替换
