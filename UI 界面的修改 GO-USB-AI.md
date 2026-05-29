# UI 界面的修改 GO-USB-AI

> 2026-05-27 | GO-USB-AI 品牌名称优化

---

## 📋 任务概述

优化 GO-USB-AI 项目的品牌名称展示策略：
- **主标题**保留 `GO-USB-AI`（增强视觉冲击力）
- **其他所有文本**使用 `GoUsbAi`（保持阅读流畅性）

此策略兼顾了品牌辨识度和用户阅读体验。

---

## 🔧 修改文件清单

### 1. 后端 API（关键！）

**文件**：`packages/go-usb-ai-server/src/app/controllers/app.controller.ts`

```typescript
// 修改前
function buildAppMetaView(options: UiRouterOptions): AppMetaView {
  return {
    name: "GoUsbAi",  // ← 修改
    productVersion: productVersion && productVersion.length > 0 ? productVersion : "0.0.0"
  };
}

// 修改后
function buildAppMetaView(options: UiRouterOptions): AppMetaView {
  return {
    name: "GO-USB-AI",
    productVersion: productVersion && productVersion.length > 0 ? productVersion : "0.0.0"
  };
}
```

**重要性**：后端 API 返回的名称会覆盖前端的 fallback 值，必须修改！

---

### 2. 前端入口文件

**文件**：`packages/go-usb-ai-ui/index.html`

```html
<!-- 修改前 -->
<meta name="apple-mobile-web-app-title" content="GoUsbAi" />
<title>GoUsbAi</title>

<!-- 修改后 -->
<meta name="apple-mobile-web-app-title" content="GO-USB-AI" />
<title>GO-USB-AI</title>
```

---

### 3. PWA 应用配置

**文件**：`packages/go-usb-ai-ui/public/manifest.webmanifest`

```json
{
  "name": "GO-USB-AI",
  "short_name": "GO-USB-AI",
  "description": "GO-USB-AI is your installable AI operating layer..."
}
```

---

### 4. 国际化文本（i18n）

**文件**：`packages/go-usb-ai-ui/src/shared/lib/i18n/index.ts`

```typescript
authBrand: { zh: 'GO-USB-AI UI', en: 'GO-USB-AI UI' },
authLoginDescription: {
  zh: '认证已开启。登录后才能查看这台机器的 GO-USB-AI UI。',
  en: 'Authentication is enabled. Sign in to access this machine’s GO-USB-AI UI.'
},
authSessionMemoryNotice: { zh: '当前版本的会话只保存在服务端内存里。GO-USB-AI UI 进程重启后，需要重新登录。', en: 'Sessions are stored only in server memory for now. You will need to sign in again after the GO-USB-AI UI process restarts.' },
runtimeCompanionEnabledHelp: { zh: '开启后会自动拉起悬浮 Companion；关闭后会立即停止，并在下次启动时保持关闭。', en: 'When enabled, GO-USB-AI auto-starts the floating companion. When disabled, it stops immediately and stays off after restart.' },
```

**文件**：`packages/go-usb-ai-ui/src/shared/lib/i18n/pwa.ts`

所有包含 `GoUsbAi` 的文本均修改为 `GO-USB-AI`：
- `pwaInstallDescription`
- `pwaInstallAction`
- `pwaInstalledToast`
- `pwaInstallCardPrompt`
- `pwaInstallCardManual`
- `pwaInstallCardInstalled`
- `pwaInstallPromptHint`
- `pwaInstallBannerTitle`
- `pwaInstallBannerDescription`
- `pwaUpdateBannerTitle`

---

### 5. 品牌头部组件

**文件**：`packages/go-usb-ai-ui/src/shared/components/common/brand-header.tsx`

```typescript
// 修改前
const productName = data?.name ?? 'GoUsbAi';

// 修改后
const productName = data?.name ?? 'GO-USB-AI';
```

---

### 6. 动态标题生成

**文件**：`packages/go-usb-ai-ui/src/shared/lib/ui-document-title/index.ts`

```typescript
// 修改前
const PRODUCT = 'GoUsbAi';

// 修改后
const PRODUCT = 'GO-USB-AI';
```

**影响**：浏览器标签页标题和 PWA 窗口标题栏

---

### 7. 桌面应用配置（可选）

**文件**：`apps/desktop/package.json`

```json
{
  "description": "GO-USB-AI desktop shell powered by Electron.",
  "author": "GO-USB-AI Team",
  "productName": "GO-USB-AI Desktop",
  "artifactName": "GO-USB-AI.Desktop-Setup-${version}-${arch}.${ext}",
  "shortcutName": "GO-USB-AI Desktop",
  "uninstallDisplayName": "GO-USB-AI Desktop",
  "maintainer": "GO-USB-AI Team",
  "synopsis": "GO-USB-AI Desktop"
}
```

---

## 🚀 构建与部署步骤

### 步骤 1：重新构建后端

```powershell
pnpm --filter @go-usb-ai/server build
```

### 步骤 2：重新构建前端

```powershell
pnpm -C packages/go-usb-ai-ui build
```

### 步骤 3：复制前端资源到后端

```powershell
node packages/go-usb-ai/scripts/copy-ui-dist.mjs
```

### 步骤 4：重启后端服务

```powershell
pnpm dev:backend
```

---

## ✅ 验证清单

| 验证项 | 预期结果 | 验证方法 |
|--------|---------|---------|
| 后端 API | `{"name":"GO-USB-AI","productVersion":"0.19.30"}` | `Invoke-WebRequest -Uri 'http://127.0.0.1:18792/api/app/meta'` |
| 侧边栏品牌名 | `GO-USB-AI v0.19.30` | 访问首页查看 |
| 浏览器标签页标题 | `GO-USB-AI - 对话` | 查看浏览器标签 |
| PWA 窗口标题栏 | `GO-USB-AI - 对话` | 安装 PWA 后查看 |
| PWA 安装提示 | `安装 GO-USB-AI` | 访问首页查看弹窗 |

---

## 🔴 常见问题

### 问题 1：修改后页面仍显示旧名称

**原因**：浏览器缓存了旧代码

**解决方案**：
1. 按 `Ctrl + Shift + Delete` 清除缓存
2. 或使用无痕窗口访问
3. 或重启浏览器

### 问题 2：PWA 应用名称未更新

**原因**：PWA 安装时缓存了旧的 manifest

**解决方案**：
1. 打开 `edge://apps` 或 `chrome://apps`
2. 右键卸载旧应用
3. 重新访问首页安装新应用

### 问题 3：后端 API 返回仍为旧名称

**原因**：后端服务未重启，仍运行旧代码

**解决方案**：
1. 停止后端服务
2. 重新构建后端 `pnpm --filter @go-usb-ai/server build`
3. 重启后端服务

---

## 📊 修改前后对比

### 主应用界面（保持 GO-USB-AI）

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| API 返回 | `{"name":"GoUsbAi"}` | `{"name":"GO-USB-AI"}` |
| 侧边栏 | `GoUsbAi v0.19.30` | `GO-USB-AI v0.19.30` |
| 浏览器标签 | `GoUsbAi - 对话` | `GO-USB-AI - 对话` |
| PWA 标题栏 | `GoUsbAi - 对话` | `GO-USB-AI - 对话` |
| PWA 安装按钮 | `安装 GoUsbAi` | `安装 GO-USB-AI` |
| 桌面应用名称 | `GoUsbAi Desktop` | `GO-USB-AI Desktop` |

### Landing 页面（主标题 GO-USB-AI，其他 GoUsbAi）

| 位置 | 修改后 |
|------|--------|
| **页面主标题** | `GO-USB-AI` ✅ |
| **导航栏品牌名** | `GoUsbAi` |
| **下载标题** | `Download GoUsbAi Desktop` |
| **终端提示** | `GoUsbAi started` / `GoUsbAi 已启动` |
| **FAQ** | `GoUsbAi 和 OpenClaw 的区别` |
| **页脚项目名** | `GoUsbAi Project` / `GoUsbAi 项目` |
| **所有元数据** | `GoUsbAi` |

---

## 📝 总结

### 修改策略

采用**差异化展示策略**：

| 场景 | 品牌名 | 原因 |
|------|--------|------|
| **主标题/Landing大标题** | `GO-USB-AI` | 视觉冲击力强，突出品牌标识 |
| **所有其他文本** | `GoUsbAi` | 阅读流畅，符合用户习惯 |

### 修改文件清单

| 类型 | 文件数 | 文件列表 |
|------|--------|----------|
| 后端代码 | 1 | `packages/go-usb-ai-server/src/app/controllers/app.controller.ts` |
| 主应用前端 | 6 | `index.html`, `manifest.webmanifest`, `i18n/index.ts`, `i18n/pwa.ts`, `brand-header.tsx`, `ui-document-title/index.ts` |
| 桌面配置 | 1 | `apps/desktop/package.json` |
| Landing 页面 | 3 | `src/main.ts`, `zh/index.html`, `en/index.html` |
| **总计** | **11** | |

### 设计考量

1. **美观性**：`GoUsbAi` 的 camelCase 形式更流畅，符合现代品牌设计趋势
2. **辨识度**：`GO-USB-AI` 的全大写加连字符形式在标题中更醒目
3. **一致性**：保持代码变量名与品牌名的统一风格
4. **用户体验**：平衡视觉冲击力和阅读舒适度

### 完成标志

✅ Landing 页面主标题显示 `GO-USB-AI`  
✅ 所有其他文本显示 `GoUsbAi`  
✅ 主应用界面全部显示 `GO-USB-AI`

---

**文档信息**：
- 创建时间：2026-05-27
- 适用版本：GO-USB-AI v0.19.30
- 修改策略：差异化品牌展示