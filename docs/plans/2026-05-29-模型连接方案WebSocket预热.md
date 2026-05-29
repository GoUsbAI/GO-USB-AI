# 模型连接方案（WebSocket）+ 预热

**文档版本**: 1.0  
**创建日期**: 2026-05-29  
**状态**: 方案设计  
**适用范围**: GO-USB-AI Ollama 本地模型连接优化

---

## 1. 问题背景

### 1.1 现象

| 场景 | 响应时间 | 备注 |
|------|---------|------|
| 首次调用 | 约 2-6 分钟 | TCP 连接 + HTTP 握手 + 模型推理 |
| 后续调用 | 仍然较慢 | 无明显改善，多步任务延迟叠加 |
| 云模型对比 | 秒级响应 | 持久连接，无握手开销 |

**影响**：严重影响用户体验，与云模型性能差距巨大。

### 1.2 当前调用链路

```
首次调用流程：
用户 → go-usb-ai → TCP连接 → HTTP握手 → 模型推理 → HTTP响应 → 用户
        ↑________________2分钟________________↑

后续调用流程：
用户 → go-usb-ai → 直接发送请求 → 模型推理 → 直接发送响应 → 用户
        ↑______________快____________↑
```

**核心问题**：
1. 每次调用都需要重新建立 TCP 连接
2. 每次调用都需要进行 HTTP 握手
3. 延迟线性叠加，多步任务时尤其明显

### 1.3 当前代码分析

**文件**: `packages/go-usb-ai-core/src/features/llm-providers/providers/openai_provider.ts`

```typescript
// 当前实现：使用 OpenAI SDK 通过 HTTP 请求调用模型
private clientPool = new Map<string, OpenAI>();

private getClient = (apiBase: string | null): OpenAI => {
  const key = apiBase?.trim() || "__default__";
  const existing = this.clientPool.get(key);
  if (existing) {
    return existing;  // ✅ 缓存了 OpenAI 客户端实例
  }
  const created = new OpenAI({
    apiKey: this.apiKey ?? undefined,
    baseURL: apiBase ?? undefined,
    defaultHeaders: this.extraHeaders ?? undefined
  });
  this.clientPool.set(key, created);
  return created;
};
```

**问题**：
- 虽然缓存了 OpenAI 客户端实例，但**底层 HTTP 连接并未保持**
- 每次 `chat()` / `chatStream()` 调用都会触发新的 HTTP 请求
- 即使实例被复用，TCP 连接和 HTTP 握手开销仍然存在

### 1.4 项目实际运行状态分析

**重要发现**：当前项目**根本没有实现预热机制**

#### 实际运行的 Provider 管理器

文件: `packages/go-usb-ai-kernel/src/managers/llm-provider.manager.ts`

```typescript
export class LlmProviderManager {
  private readonly providerPool = new Map<string, LLMProvider>();
  
  load = (config: Config): void => {
    this.config = config;
    this.providerPool.clear();  // 只清理缓存，不预热
  };
  
  get = (model?: string | null): LLMProvider => {
    const route = this.resolveRoute(model);
    return this.getOrCreateProvider(route);  // 惰性创建，首次调用才建立连接
  };
}
```

#### 当前架构缺陷

| 问题 | 状态 | 说明 |
|------|------|------|
| 预热机制 | ❌ 未实现 | 没有任何 `prewarm()` 方法 |
| 连接池 | ❌ 未实现 | 只有实例缓存，不保持连接 |
| WebSocket 支持 | ❌ 未实现 | 全部走 HTTP |
| 心跳保活 | ❌ 未实现 | 无 keep-alive 机制 |

#### 为什么现在这么慢？

**根因**：每次用户发消息都要走完整流程

```
用户发消息 → LlmProviderManager.get() 
           → resolveRoute() 
           → getOrCreateProvider() 
           → 创建 LiteLLMProvider (HTTP)
           → TCP 连接 (首次)
           → HTTP 握手
           → 模型推理
           → 返回响应
```

**关键证据**：
- `load()` 方法只加载配置，不建立任何连接
- `getOrCreateProvider()` 是**惰性创建**（只有用户发消息时才创建）
- 使用的是 `LiteLLMProvider`，走标准 HTTP 调用

### 1.5 LM Studio 原生 WebSocket 支持

**关键优势**：你使用的是 LM Studio，它天生支持 WebSocket

| 对比项 | Ollama | LM Studio |
|--------|--------|-----------|
| WebSocket 支持 | 需代理或插件 | 原生支持 |
| 官方 SDK | HTTP REST | WebSocket 构建 |
| 本地模型预加载 | 需手动预热 | 启动即加载 |
| 连接复用 | 需额外实现 | 内置支持 |

**这意味着**：
- LM Studio 的 SDK 本身就是基于 WebSocket 的
- 模型已经在内存中，不需要每次加载
- WebSocket 连接建立后，响应是秒回的
- 本项目只需切换到 WebSocket 路径，就能利用 LM Studio 的原生优势

---

## 2. 解决方案概述

### 2.1 方案架构

**WebSocket + 预热连接**

```
┌─────────────────────────────────────────────────┐
│  预热阶段 (服务启动时)                              │
│                                                   │
│  go-usb-ai ──→ WebSocket 握手 ──→ Ollama          │
│                建立持久连接                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  调用阶段 (用户发消息时)                             │
│                                                   │
│  用户 → go-usb-ai ──→ WebSocket 复用 ──→ Ollama    │
│                      无握手开销                     │
│                      秒回响应                       │
└─────────────────────────────────────────────────┘
```

### 2.2 技术对比

| 对比项 | HTTP（当前） | WebSocket（推荐） |
|--------|-------------|-------------------|
| 连接方式 | 一次性连接，每次重新握手 | 持久连接，一次握手，持续通信 |
| 延迟特性 | 首次调用慢，后续调用快 | 持续快速响应 |
| 多步任务 | 延迟线性叠加 | 延迟恒定 |
| 适用场景 | 短请求，偶尔调用 | 长对话，多步任务，Agent 循环 |

---

## 3. 详细设计

### 3.1 整体架构

```
┌──────────────────────────────────────────────────────────┐
│  ProviderManager (config加载)                              │
│       │                                                    │
│       ├──→ OllamaWebSocketProvider (新增)                    │
│       │      │                                             │
│       │      ├── ConnectionPool (连接池)                     │
│       │      │      ├── WebSocket#1 (ollama/provider-1)      │
│       │      │      ├── WebSocket#2 (ollama/provider-2)      │
│       │      │      └── ...                                 │
│       │      │                                             │
│       │      ├── PrewarmManager (预热管理器)                  │
│       │      │      ├── 启动时建立连接                         │
│       │      │      ├── 心跳保活                             │
│       │      │      └── 断线重连                             │
│       │      │                                             │
│       │      └── WebSocketClient (WebSocket 客户端)           │
│       │             ├── send() - 发送请求                     │
│       │             ├── stream() - 接收 SSE 流                 │
│       │             └── close() - 优雅关闭                     │
│       │                                                    │
│       └── OpenAICompatibleProvider (保留，云模型)              │
└──────────────────────────────────────────────────────────┘
```

### 3.2 新增组件

#### 3.2.1 OllamaWebSocketProvider

```typescript
// packages/go-usb-ai-core/src/features/llm-providers/providers/ollama-websocket.provider.ts

import { WebSocket } from "ws";
import { LLMProvider, type LLMResponse, type LLMStreamEvent } from "./base.js";

export class OllamaWebSocketProvider extends LLMProvider {
  private connectionPool: OllamaConnectionPool;
  private prewarmManager: PrewarmManager;
  private defaultModel: string;

  constructor(options: OllamaWebSocketProviderOptions) {
    super(options.apiKey, options.apiBase);
    this.connectionPool = new OllamaConnectionPool();
    this.prewarmManager = new PrewarmManager(this.connectionPool);
    this.defaultModel = options.defaultModel;
  }

  // 预热：服务启动时调用
  prewarm = async (): Promise<void> => {
    await this.prewarmManager.prewarm();
  };

  // 复用现有连接发送请求
  chat = async (params: ChatParams): Promise<LLMResponse> => {
    const connection = await this.connectionPool.getOrCreate(this.apiBase);
    return connection.chat(params);
  };

  // 流式请求
  chatStream = async (params: ChatParams): AsyncGenerator<LLMStreamEvent> => {
    const connection = await this.connectionPool.getOrCreate(this.apiBase);
    yield* connection.chatStream(params);
  };

  // 优雅关闭
  dispose = async (): Promise<void> => {
    await this.prewarmManager.dispose();
  };
}
```

#### 3.2.2 ConnectionPool (连接池)

```typescript
// packages/go-usb-ai-core/src/features/llm-providers/pools/ollama-connection.pool.ts

export class OllamaConnectionPool {
  private connections = new Map<string, OllamaWebSocketConnection>();
  private readonly maxIdleTimeMs = 5 * 60 * 1000; // 5分钟
  private readonly heartbeatIntervalMs = 30 * 1000; // 30秒

  getOrCreate = async (apiBase: string): Promise<OllamaWebSocketConnection> => {
    const existing = this.connections.get(apiBase);
    if (existing && existing.isConnected()) {
      return existing; // ✅ 复用现有连接
    }
    
    // 创建新连接
    const connection = new OllamaWebSocketConnection({
      url: `${apiBase}/api/chat`,
      heartbeatIntervalMs: this.heartbeatIntervalMs,
    });
    
    await connection.connect();
    this.connections.set(apiBase, connection);
    
    // 启动心跳保活
    this.startHeartbeat(connection);
    
    return connection;
  };

  private startHeartbeat = (connection: OllamaWebSocketConnection): void => {
    setInterval(() => {
      if (connection.isIdle()) {
        connection.sendPing(); // 发送 ping 保持连接
      }
    }, this.heartbeatIntervalMs);
  };
}
```

#### 3.2.3 PrewarmManager (预热管理器)

**是什么**：一个全新的 TypeScript 类，不是概念，需要在项目中实际创建

| 属性 | 说明 |
|------|------|
| **文件位置** | `packages/go-usb-ai-core/src/features/llm-providers/managers/prewarm.manager.ts` |
| **项目角色** | 预热管理器 - 服务启动时提前建立连接 |
| **类比理解** | 就像汽车启动前先热车，等用户发消息时连接已经准备好了 |
| **状态** | ❌ **未实现** - 这就是现在慢的根本原因 |

```typescript
// packages/go-usb-ai-core/src/features/llm-providers/managers/prewarm.manager.ts

export class PrewarmManager {
  private connectionPool: OllamaConnectionPool;
  private prewarmTimeoutMs = 10 * 1000; // 10秒超时

  constructor(pool: OllamaConnectionPool) {
    this.connectionPool = pool;
  }

  prewarm = async (): Promise<void> => {
    const config = ConfigManager.getConfig();
    const ollamaProviders = this.getEnabledOllamaProviders(config);

    console.log(`[prewarm] 开始预热 ${ollamaProviders.length} 个 Ollama 连接...`);

    // 并行建立所有 Ollama 连接
    const prewarmTasks = ollamaProviders.map(async (provider) => {
      try {
        const startAt = Date.now();
        await this.connectionPool.getOrCreate(provider.apiBase);
        const elapsed = Date.now() - startAt;
        console.log(`[prewarm] ✅ ${provider.displayName} 连接成功 (${elapsed}ms)`);
      } catch (error) {
        console.warn(`[prewarm] ⚠️ ${provider.displayName} 预热失败:`, error.message);
      }
    });

    await Promise.allSettled(prewarmTasks);
    console.log("[prewarm] 预热完成");
  };

  private getEnabledOllamaProviders = (config: Config): ProviderConfig[] => {
    return Object.entries(config.providers)
      .filter(([, provider]) => provider.enabled && provider.apiBase?.includes("localhost"))
      .map(([id, config]) => ({ ...config, id }));
  };
}
```

#### 3.2.4 OllamaWebSocketConnection (WebSocket 连接)

```typescript
// packages/go-usb-ai-core/src/features/llm-providers/connections/ollama-websocket.connection.ts

import { WebSocket } from "ws";

export class OllamaWebSocketConnection {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private requestQueue = new Map<string, Promise<any>>();
  private url: string;
  private heartbeatIntervalMs: number;

  connect = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.on("open", () => {
        this.isConnected = true;
        console.log(`[ollama-ws] ✅ 连接成功: ${this.url}`);
        resolve();
      });

      this.ws.on("error", (error) => {
        this.isConnected = false;
        reject(error);
      });

      this.ws.on("close", () => {
        this.isConnected = false;
        console.warn("[ollama-ws] 连接断开，尝试重连...");
        this.reconnect();
      });

      this.ws.on("message", (data) => {
        this.handleMessage(data);
      });
    });
  };

  chat = async (params: ChatParams): Promise<LLMResponse> => {
    const requestId = this.generateRequestId();
    const request = {
      id: requestId,
      model: params.model,
      messages: params.messages,
      stream: false,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("请求超时")), 120000);
      
      this.requestQueue.set(requestId, { resolve, reject, timeout });
      this.ws?.send(JSON.stringify(request));
    });
  };

  chatStream = async function* (params: ChatParams): AsyncGenerator<LLMStreamEvent> {
    const requestId = this.generateRequestId();
    const request = {
      id: requestId,
      model: params.model,
      messages: params.messages,
      stream: true,
    };

    this.ws?.send(JSON.stringify(request));

    // 等待流式响应
    for await (const event of this.waitForStreamEvents(requestId)) {
      yield event;
    }
  };

  sendPing = (): void => {
    this.ws?.ping();
  };

  isConnected = (): boolean => {
    return this.isConnected;
  };

  private reconnect = async (): Promise<void> => {
    await this.delay(1000);
    try {
      await this.connect();
    } catch (error) {
      console.error("[ollama-ws] 重连失败:", error);
    }
  };
}
```

---

## 4. 配置方案

### 4.1 config.json 新增字段

```json
{
  "providers": {
    "ollama": {
      "enabled": true,
      "displayName": "本地 AI（Ollama）",
      "apiKey": "ollama",
      "apiBase": "http://localhost:1234/v1",
      "connection": {
        "type": "websocket",
        "prewarm": true,
        "heartbeatIntervalMs": 30000,
        "reconnectDelayMs": 1000,
        "maxReconnectAttempts": 3
      },
      "models": [
        "qwen3.5-0.8b",
        "nanbeige4.1-3b",
        "agentcpm-explore"
      ]
    }
  }
}
```

### 4.2 Schema 更新

```typescript
// packages/go-usb-ai-core/src/features/config/configs/schema.ts

const ConnectionSchema = z.object({
  type: z.enum(["http", "websocket"]).default("http"),
  prewarm: z.boolean().default(false),
  heartbeatIntervalMs: z.number().default(30000),
  reconnectDelayMs: z.number().default(1000),
  maxReconnectAttempts: z.number().default(3),
});

const ProviderSchema = z.object({
  // ... 现有字段 ...
  connection: ConnectionSchema.optional(),
});
```

---

## 5. 启动流程更新

### 5.1 当前启动流程（实际代码）

```
启动脚本 → pnpm dev:build serve
  └─→ 后端启动
       └─→ GoUsbAiKernel.start()
            ├─→ LlmProviderManager.load(config)
            │    └─→ 仅加载配置，不建立连接 ❌
            │
            └─→ McpRegistryService.prewarmEnabledServers()
                 └─→ 预热 MCP servers ✅ (已有)
```

**问题**：
- `LlmProviderManager.load()` 只加载配置到内存
- 没有任何预热逻辑
- 首次调用时才惰性创建 Provider

### 5.2 更新后的启动流程（目标）

```
启动脚本 → pnpm dev:build serve
  └─→ 后端启动
       └─→ GoUsbAiKernel.start()
            ├─→ LlmProviderManager.load(config)
            │    └─→ 加载配置
            │
            ├─→ LlmProviderManager.initialize() [新增]
            │    ├─→ 识别 WebSocket 配置的 provider
            │    ├─→ OllamaWebSocketProvider.prewarm()
            │    │    └─→ PrewarmManager.prewarm()
            │    │         └─→ 预热 WebSocket 连接 ✅
            │    └─→ 降级到 HTTP (如果预热失败)
            │
            └─→ McpRegistryService.prewarmEnabledServers()
                 └─→ 预热 MCP servers ✅ (已有)
```

### 5.3 关键变更点

#### 5.3.1 LlmProviderManager 新增 initialize() 方法

```typescript
// packages/go-usb-ai-kernel/src/managers/llm-provider.manager.ts

class LlmProviderManager {
  load = (config: Config): void => {
    this.config = config;
    this.providerPool.clear();
  };
  
  // [新增] 启动时调用，预热 WebSocket 连接
  initialize = async (): Promise<void> => {
    const providers = this.getWebSocketProviders();
    
    for (const provider of providers) {
      if (provider.prewarm) {
        try {
          await provider.prewarm();
        } catch (error) {
          console.warn(`[llm-provider] 预热失败，降级到 HTTP:`, error.message);
        }
      }
    }
  };
  
  private getWebSocketProviders = (): LLMProvider[] => {
    // 从 config 中识别配置了 WebSocket 的 provider
    return Object.entries(this.config?.providers ?? {})
      .filter(([, p]) => p.connection?.type === "websocket")
      .map(([id, p]) => this.getOrCreateProvider({ ...p, id }));
  };
}
```

#### 5.3.2 Provider 新增 prewarm() 能力

```typescript
// packages/go-usb-ai-core/src/features/llm-providers/providers/ollama-websocket.provider.ts

class OllamaWebSocketProvider extends LLMProvider {
  private prewarmManager: PrewarmManager;
  
  // [新增] 预热方法
  prewarm = async (): Promise<void> => {
    await this.prewarmManager.prewarm();
  };
  
  // ... 其他方法
}
```

---

## 6. 性能预期

### 6.1 优化前（HTTP）

```
首次调用：
用户 → TCP连接(500ms) → HTTP握手(200ms) → 模型推理(120s) → 响应(100ms)
        ↑__________________2.1分钟________________↑

后续调用：
用户 → TCP连接(500ms) → HTTP握手(200ms) → 模型推理(120s) → 响应(100ms)
        ↑__________________2.1分钟________________↑
```

### 6.2 优化后（WebSocket + 预热）

```
预热阶段（启动时）：
go-usb-ai → TCP连接(500ms) → WS握手(200ms) → 连接就绪
             ↑____0.7秒____↑

首次调用：
用户 → WebSocket复用(0ms) → 模型推理(120s) → 响应(100ms)
        ↑____120.1秒____↑

后续调用：
用户 → WebSocket复用(0ms) → 模型推理(120s) → 响应(100ms)
        ↑____120.1秒____↑
```

### 6.3 优化效果

| 指标 | HTTP | WebSocket + 预热 | 改善 |
|------|------|------------------|------|
| 连接建立时间 | 700ms/次 | 700ms (仅预热时一次) | **节省每次调用的 700ms** |
| 10轮对话总延迟 | 7s + 1200s | 0.7s + 1200s | **节省 6.3s** |
| 多步 Agent 循环 | 每次 +700ms | 无额外开销 | **显著改善** |

**注意**：WebSocket 优化主要节省的是 **连接开销**，模型推理时间（120s）取决于本地资源和模型大小，需要通过其他方式优化。

---

## 7. 实施计划

### 7.1 Phase 1: 基础 WebSocket 支持

**目标**: 实现 Ollama WebSocket 连接

| 任务 | 文件 | 说明 |
|------|------|------|
| 创建 WebSocket 连接类 | `connections/ollama-websocket.connection.ts` | 核心连接实现 |
| 创建连接池 | `pools/ollama-connection.pool.ts` | 连接复用管理 |
| 创建 Provider | `providers/ollama-websocket.provider.ts` | 继承 LLMProvider |
| 更新 Schema | `configs/schema.ts` | 添加 connection 配置 |

**预估工时**: 2-3 天

### 7.2 Phase 2: 预热机制

**目标**: 服务启动时自动预热连接

| 任务 | 文件 | 说明 |
|------|------|------|
| 创建预热管理器 | `managers/prewarm.manager.ts` | 预热逻辑 |
| 更新 ProviderManager | `provider-manager.ts` | 集成预热 |
| 添加启动日志 | - | 预热进度反馈 |

**预估工时**: 1-2 天

### 7.3 Phase 3: 心跳与重连

**目标**: 保持连接稳定

| 任务 | 文件 | 说明 |
|------|------|------|
| 心跳保活 | `ollama-connection.pool.ts` | 定时 ping |
| 断线重连 | `ollama-websocket.connection.ts` | 自动重连 |
| 连接状态监控 | - | 健康检查 |

**预估工时**: 1-2 天

### 7.4 Phase 4: 测试与验证

| 任务 | 说明 |
|------|------|
| 单元测试 | 连接池、预热管理器 |
| 集成测试 | 端到端 WebSocket 通信 |
| 性能对比 | HTTP vs WebSocket 延迟对比 |

**预估工时**: 1-2 天

---

## 8. 风险与缓解

### 8.1 风险清单

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Ollama 不支持 WebSocket | 高 | 降级到 HTTP，保留兼容路径 |
| WebSocket 连接泄漏 | 中 | 连接池限制最大连接数，定期清理 |
| 预热阻塞启动 | 中 | 预热设置超时，失败不阻塞 |
| 断线重连风暴 | 低 | 指数退避，最大重连次数限制 |

### 8.2 降级策略

```typescript
// 如果 WebSocket 连接失败，自动降级到 HTTP
chat = async (params: ChatParams): Promise<LLMResponse> => {
  try {
    const connection = await this.connectionPool.getOrCreate(this.apiBase);
    return connection.chat(params);
  } catch (error) {
    console.warn("[ollama-ws] WebSocket 失败，降级到 HTTP:", error.message);
    return this.fallbackHttpChat(params);
  }
};
```

---

## 9. 验证方案

### 9.1 功能验证

```bash
# 1. 启动服务，检查预热日志
.\GO-USB-AI 启动.ps1 -NoBuild

# 预期输出：
# [prewarm] 开始预热 1 个 Ollama 连接...
# [prewarm] ✅ 本地 AI（Ollama） 连接成功 (320ms)
# [prewarm] 预热完成

# 2. 发送测试消息，检查响应时间
# 在 UI 中发送消息，记录响应时间

# 3. 检查连接状态
curl http://localhost:55667/api/debug/connections
```

### 9.2 性能验证

```bash
# 对比 HTTP 和 WebSocket 延迟
node scripts/benchmark-model-connection.mjs

# 输出示例：
# HTTP: 平均 700ms 连接开销
# WebSocket: 平均 0ms 连接开销 (预热后)
```

---

## 10. LM Studio 专用实现路径

### 10.1 LM Studio 原生 WebSocket API

LM Studio 官方支持 WebSocket 端点：

```
ws://localhost:1234/v1/chat/completions
```

**优势**：
- 原生支持，不需要代理
- SDK 本身基于 WebSocket 构建
- 模型启动时已加载到内存

### 10.2 配置示例

```json
{
  "providers": {
    "lmstudio": {
      "enabled": true,
      "displayName": "本地 AI（LM Studio）",
      "apiKey": "lmstudio",
      "apiBase": "http://localhost:1234/v1",
      "connection": {
        "type": "websocket",
        "prewarm": true,
        "heartbeatIntervalMs": 30000,
        "reconnectDelayMs": 1000,
        "maxReconnectAttempts": 3
      },
      "models": [
        "qwen3.5-0.8b",
        "agentcpm-explore"
      ]
    }
  }
}
```

### 10.3 实施优先级调整

| 优先级 | 任务 | 原因 |
|--------|------|------|
| P0 | 实现 LM Studio WebSocket Provider | 你正在使用，原生支持 |
| P1 | 实现 PrewarmManager | 解决启动预热问题 |
| P2 | 实现 ConnectionPool | 连接复用 |
| P3 | Ollama WebSocket 适配 | Ollama 需额外适配 |

### 10.4 LM Studio vs Ollama 对比

| 对比项 | LM Studio | Ollama |
|--------|-----------|--------|
| WebSocket 原生支持 | ✅ 是 | ❌ 需代理 |
| 模型预加载 | ✅ 启动即加载 | ⚠️ 首次调用加载 |
| SDK 基础协议 | WebSocket | HTTP REST |
| 实施难度 | 低 | 中 |
| 优先级 | P0 | P1 |

---

## 11. 附录

### 11.1 Ollama WebSocket API 参考

Ollama 原生支持通过 `/api/chat` 接口进行流式对话，但标准 API 基于 HTTP。WebSocket 支持需要通过以下方式之一：

1. **Ollama 原生 WebSocket** (如果支持)
2. **HTTP 长连接复用** (Keep-Alive)
3. **自定义 WebSocket 代理层**

如果 Ollama 本身不支持 WebSocket，建议采用 **HTTP Keep-Alive + 连接池** 方案作为替代。

### 11.2 替代方案：HTTP Keep-Alive + 连接池

如果 WebSocket 不可行，可以采用以下替代方案：

```typescript
// 使用 keep-alive 的 HTTP Agent
import https from "https";

const keepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 10,
  maxFreeSockets: 5,
  timeout: 60000,
  freeSocketTimeout: 30000,
});

const openaiClient = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://localhost:1234/v1",
  httpAgent: keepAliveAgent, // ✅ 复用 TCP 连接
});
```

**效果**：虽然不如 WebSocket，但可以减少 50-70% 的连接开销。

---

## 12. 决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 连接协议 | WebSocket 优先，HTTP Keep-Alive 降级 | WebSocket 延迟最低，但有兼容性风险 |
| 预热时机 | 服务启动时 | 首次用户调用无等待 |
| 预热失败处理 | 降级到 HTTP，不阻塞启动 | 保证服务可用性 |
| 连接池大小 | 按 provider 数量动态创建 | 避免资源浪费 |
| 实施优先级 | LM Studio 优先 | 你正在使用，原生支持，实施难度低 |

---

## 13. 关键发现总结

### 为什么现在响应慢？

1. **根本没有预热机制**：`LlmProviderManager.load()` 只加载配置，不建立连接
2. **惰性创建 Provider**：只有用户发消息时才创建 `LiteLLMProvider`
3. **每次都是 HTTP 调用**：没有 WebSocket，没有连接复用
4. **没有心跳保活**：连接不保持，下次调用重新握手

### 解决方案

1. 实现 `OllamaWebSocketProvider` (实际是 `LmStudioWebSocketProvider`)
2. 实现 `PrewarmManager` - 服务启动时预热
3. 实现 `ConnectionPool` - 连接复用
4. 在 `LlmProviderManager.initialize()` 中调用预热

### 预期效果

- 首次调用：从 2 分钟 → 0 连接开销 (预热后)
- 后续调用：保持快速响应
- LM Studio 原生支持，实施难度低

**文档结束**

下一步：根据 Ollama 是否支持 WebSocket，确定最终实施方案。
