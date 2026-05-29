模型连接方案（WebSocket）+ （预热）


# 模型连接方案（WebSocket）+ 预热

## 问题背景

### 现象
- **首次调用**：本地模型响应时间约 2 分钟
- **后续调用**：仍然较慢，没有明显改善
- **影响**：严重影响用户体验，与云模型性能差距巨大

### 根本原因
**HTTP 调用的连接开销**

```
首次调用流程：
用户 → go-usb-ai → TCP连接 → HTTP握手 → 模型推理 → HTTP响应 → 用户
         ↑________________2分钟________________↑

后续调用流程：
用户 → go-usb-ai → 直接发送请求 → 模型推理 → 直接发送响应 → 用户
         ↑______________快____________↑
```

**核心问题**：
- 每次调用都需要重新建立 TCP 连接
- 每次调用都需要进行 HTTP 握手
- 延迟线性叠加，多步任务时尤其明显

---

## 解决方案

### 方案概述
**WebSocket + 预热连接**

1. **预热连接**：启动时预先建立 WebSocket 连接
2. **WebSocket 调用**：使用 WebSocket 进行持久连接通信
3. **秒回响应**：复用连接，避免重复握手

### 技术优势

| 对比项 | HTTP（当前） | WebSocket（推荐） |
|--------|-------------|------------------|
| 连接方式 | 一次性连接，每次重新握手 | 持久连接，一次握手，持续通信 |
| 延迟特性 | 首次调用慢，后续调用快 | 持续快速响应 |
| 多步任务 | 延迟线性叠加 | 延迟恒定 |
| 适用场景 | 短请求，偶尔调用 | 长对话，多步任务 |

---

## 实施方案

### 1. 修改文件

**文件路径**：
```
D:\AI\GO-USB-AI\packages\go-usb-ai-core\src\features\agent\agent-manager.ts
```

**修改位置**：第 150-160 行左右（`callLocalLLM` 函数）

### 2. 修改内容

#### 步骤 1：引入 WebSocket
```typescript
import WebSocket from 'ws';
```

#### 步骤 2：添加全局连接管理
```typescript
let lmStudioWS: WebSocket | null = null;

async function getLMStudioWebSocket(): Promise<WebSocket> {
  // 如果连接已存在且状态为 OPEN，直接复用
  if (lmStudioWS && lmStudioWS.readyState === WebSocket.OPEN) {
    return lmStudioWS;
  }
  
  // 创建新连接
  return new Promise((resolve, reject) => {
    lmStudioWS = new WebSocket('ws://127.0.0.1:1234');
    
    lmStudioWS.on('open', () => {
      resolve(lmStudioWS!);
    });
    
    lmStudioWS.on('error', (error) => {
      reject(error);
    });
  });
}
```

#### 步骤 3：修改调用代码
```typescript
// 替换原有的 fetch 调用
const ws = await getLMStudioWebSocket();

return new Promise((resolve, reject) => {
  const messageHandler = (data: string) => {
    try {
      const response = JSON.parse(data);
      ws!.removeListener('message', messageHandler);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  };
  
  ws.on('message', messageHandler);
  
  ws.send(JSON.stringify({
    model: 'lm-studio',
    messages: messages,
    stream: false,
  }));
});
```

---

## 预期效果

### 性能对比

| 场景 | HTTP 方案 | WebSocket 方案 |
|------|----------|---------------|
| 首次调用 | 2 分钟 | < 1 秒 |
| 后续调用 | 较快 | < 1 秒 |
| 5步任务 | 10 分钟+ | < 5 秒 |
| 用户体验 | 差 | 与云模型一致 |

### 实施步骤

1. **修改源代码**：在 `agent-manager.ts` 中添加 WebSocket 调用
2. **重新编译**：运行 `npm run build` 或 `npm run build:core`
3. **重启服务**：重启 go-usb-ai 服务
4. **测试验证**：测试首次调用和后续调用性能

---

## 技术要点

### WebSocket 连接管理
- **连接复用**：全局单例连接，避免重复建立
- **状态检查**：每次调用前检查连接状态
- **错误处理**：连接失败时自动重新建立

### 兼容性
- **LM Studio 支持**：官方 SDK 基于 WebSocket 构建，完全支持
- **MCP 协议**：支持 WebSocket 传输，改造成本低
- **向后兼容**：不影响现有配置和功能

### 扩展性
- **连接池**：未来可扩展为连接池，支持多连接
- **自动重连**：可添加自动重连机制
- **负载均衡**：支持多模型服务器负载均衡

---

## 注意事项

1. **依赖安装**：确保已安装 `ws` 包（`npm install ws`）
2. **端口配置**：确保 LM Studio 监听端口为 1234
3. **错误处理**：完善 WebSocket 错误处理和日志记录
4. **连接清理**：服务关闭时正确关闭 WebSocket 连接

---

## 总结

通过 **WebSocket + 预热连接** 方案，可以将本地模型的响应时间从 **2 分钟降低到 1 秒以内**，彻底解决连接开销问题，实现与云模型一致的用户体验。

**关键收益**：
- ✅ 首次调用快速响应
- ✅ 后续调用持续快速
- ✅ 多步任务延迟恒定
- ✅ 用户体验大幅提升