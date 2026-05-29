# GO-USB-AI 升级更新报错

> 2026-05-28 | Runtime Update 功能在浏览器模式下的报错分析

---

## 📋 问题现象

![更新失败截图](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==)

在 GO-USB-AI 前端界面中，品牌名称（Logo）右侧出现 **黄色感叹号** 图标，鼠标悬停后显示提示：

> **更新失败**
> **fetch failed**

##  问题分析

### 报错位置

品牌头部组件 [brand-header.tsx](file:///d:/AI/GO-USB-AI/packages/go-usb-ai-ui/src/shared/components/common/brand-header.tsx#L90-L123)：

```typescript
function RuntimeUpdateInlineStatus() {
  const { supported, busyAction, snapshot } = useRuntimeUpdateStore();
  if (!supported || !snapshot) {
    return null;
  }
  // status 为 'failed' 时，显示黄色感叹号图标
  if (snapshot.status === 'downloading' || snapshot.status === 'blocked' || snapshot.status === 'failed') {
    return <RuntimeUpdateInlineBadge snapshot={snapshot} />;
  }
  // ...
}

function RuntimeUpdateIssueIcon({ snapshot }: { snapshot: UpdateSnapshot }) {
  const title = snapshot.status === 'failed' ? t('desktopUpdatesStatusFailed') : t('desktopUpdatesStatusBlocked');
  // ...
  return (
    <span role="img" aria-label={title} title={tooltip} className="...">
      !
    </span>
  );
}
```

### 错误链路

```
页面加载
  ↓
RuntimeUpdateManager.start()
  ↓
HostRuntimeUpdateSource.getState()
  ↓
goUsbAiClient.runtimeUpdate.fetch()
  ↓
GET /api/runtime/update
  ↓
❌ fetch 失败 → snapshot.status = 'failed'
  ↓
显示黄色感叹号 + tooltip "更新失败 / fetch failed"
```

### 根因代码

[runtime-update.manager.ts](file:///d:/AI/GO-USB-AI/packages/go-usb-ai-ui/src/features/system-status/managers/runtime-update.manager.ts#L123-L144)：

```typescript
class HostRuntimeUpdateSource implements HostRuntimeUpdateSourceContract {
  readonly kind = 'runtime-host' as const;

  getState = async (): Promise<UpdateSnapshot> => {
    return await fetchRuntimeUpdate();  // ← 调用 GET /api/runtime/update
  };
}

// Manager 中处理错误：
try {
  const snapshot = await source.getState();
  useRuntimeUpdateStore.setState({ snapshot });
} catch (error) {
  // 非 "unsupported" 错误 → 状态变为 failed
  toast.error(`${t('runtimeUpdatesLoadFailed')}: ${this.getErrorMessage(error)}`);
}
```

后端路由注册 [router.ts](file:///d:/AI/GO-USB-AI/packages/go-usb-ai-server/src/app/router.ts#L41-L53)：

```typescript
const { remoteAccess, runtimeControl, runtimeUpdate } = options;
return {
  // ...
  runtimeUpdate: runtimeUpdate ? new RuntimeUpdateRoutesController(runtimeUpdate) : null,
};

// 只有 runtimeUpdate 存在时才注册路由：
if (runtimeUpdate) {
  routes.push(
    ["get", "/api/runtime/update", runtimeUpdate.getState],
    ["post", "/api/runtime/update/check", runtimeUpdate.checkForUpdates],
    // ...
  );
}
```

---

## ❓ 为什么 `pnpm dev` 没有报错？

### 两种启动模式的差异

| 模式 | 启动命令 | 前端端口 | 后端端口 | `/api` 处理方式 | 结果 |
|------|----------|----------|----------|-----------------|------|
| **开发模式** | `pnpm dev` | `5174` | `18792` | Vite proxy 自动转发 `/api` 到后端 | ✅ 正常 |
| **构建模式** | `pnpm start` / `GO-USB-AI启动.ps1` | `55667` | `55667` | 前后端同域，直接调用 | ❌ fetch 失败 |

### Vite 代理配置

[vite.config.ts](file:///d:/AI/GO-USB-AI/packages/go-usb-ai-ui/vite.config.ts#L43-L52)：

```typescript
server: {
  host: '127.0.0.1',
  port: 5174,
  proxy: {
    '/api': {
      target: devProxyApiBase,  // 默认 http://127.0.0.1:18792
      changeOrigin: true
    },
    '/ws': {
      target: devProxyWsBase,
      ws: true
    }
  }
}
```

**开发模式下**，所有 `/api/*` 请求都被 Vite 代理到后端开发服务器（`18792`），前端不需要关心后端是否注册了这些路由——后端正常返回即可。

**构建模式下**，前端和后端合并部署在同一端口（`55667`），前端直接请求 `/api/runtime/update`，但这个端点可能因为运行时更新 host 未正确注入而返回 404 或 500，导致 `fetch` 失败。

---

## ️ 解决方案

### 方案一：静默处理（推荐）

Runtime Update 功能主要为 **Electron 桌面应用**设计，在纯浏览器模式下不需要显示更新检查。

修改 [runtime-update.manager.ts](file:///d:/AI/GO-USB-AI/packages/go-usb-ai-ui/src/features/system-status/managers/runtime-update.manager.ts#L123-L144) 的错误处理逻辑，让浏览器模式下的更新检查失败时不显示黄色感叹号：

```typescript
try {
  const snapshot = await source.getState();
  useRuntimeUpdateStore.setState({
    supported: true,
    initialized: true,
    snapshot
  });
} catch (error) {
  if (source.kind === 'runtime-host') {
    // 浏览器模式下更新功能不可用，静默处理
    useRuntimeUpdateStore.setState({
      supported: false,
      initialized: true,
      snapshot: null
    });
    return;
  }
  // ...
}
```

### 方案二：正确注入 runtimeUpdate host

在后端服务启动时确保 `runtimeUpdate` host 被正确注入到 router options 中。需要检查 `dev:build serve` 命令的启动链路，确认 host 对象的注入情况。

### 方案三：用户端忽略

此错误**不影响任何核心功能**（对话、配置、会话、技能、MCP 等），仅影响运行时自动更新检查。如果暂时不需要此功能，可以忽略。

---

## 📊 总结

| 项目 | 说明 |
|------|------|
| **报错图标** | 品牌名称右侧黄色感叹号 `!` |
| **hover 提示** | "更新失败 / fetch failed" |
| **影响范围** | 仅 Runtime Update 功能，不影响核心功能 |
| **根因** | 浏览器模式下 `/api/runtime/update` 端点不可达或返回错误 |
| **为什么 dev 正常** | Vite proxy 将 `/api` 转发到后端开发服务器 |
| **推荐修复** | 浏览器模式下将 `supported` 设为 `false`，静默隐藏更新状态 |

---

## 🔗 相关文件

| 文件 | 说明 |
|------|------|
| [brand-header.tsx](file:///d:/AI/GO-USB-AI/packages/go-usb-ai-ui/src/shared/components/common/brand-header.tsx#L90-L162) | 品牌头部组件，显示更新状态图标 |
| [runtime-update.manager.ts](file:///d:/AI/GO-USB-AI/packages/go-usb-ai-ui/src/features/system-status/managers/runtime-update.manager.ts) | Runtime Update 管理器，处理更新检查和状态 |
| [runtime-update.utils.ts](file:///d:/AI/GO-USB-AI/packages/go-usb-ai-ui/src/shared/lib/api/runtime-update.utils.ts) | API 调用封装 |
| [runtime-update.controller.ts](file:///d:/AI/GO-USB-AI/packages/go-usb-ai-server/src/features/runtime-update/controllers/runtime-update.controller.ts) | 后端路由控制器 |
| [router.ts](file:///d:/AI/GO-USB-AI/packages/go-usb-ai-server/src/app/router.ts#L248-L255) | 后端路由注册 |
| [vite.config.ts](file:///d:/AI/GO-USB-AI/packages/go-usb-ai-ui/vite.config.ts#L43-L52) | Vite 代理配置 |

---

**文档信息**：
- 创建时间：2026-05-28
- 适用版本：GO-USB-AI v0.19.30
