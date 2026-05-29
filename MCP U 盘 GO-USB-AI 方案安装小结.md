# MCP U 盘 GO-USB-AI 方案安装小结

## ⚠️ 重要提示：Playwright 无浏览器测试方法

# <span style="color: red; font-size: 24px; font-weight: bold;">🚨 重点标注：Playwright 不需要浏览器也能测试是否正常！</span>

# <span style="color: red; font-size: 24px; font-weight: bold;">❗ 别再犯低级错误：Playwright MCP 启动时不会打开浏览器，这是正常的！</span>

---

## 📋 目录

1. [MCP 配置核心要点](#mcp-配置核心要点)
2. [Playwright MCP 测试方法](#playwright-mcp-测试方法)
3. [go-usb-ai-windows MCP 测试方法](#go-usb-ai-windows-mcp-测试方法)
4. [U 盘便携版特殊配置](#u 盘便携版特殊配置)
5. [常见问题排查](#常见问题排查)

---

## MCP 配置核心要点

### 1. 环境变量支持

MCP transport 配置支持 `${GOUSB_AI_HOME}` 环境变量替换：

```typescript
// 代码位置：packages/go-usb-ai-mcp/src/client/mcp-client-factory.ts
function resolvePathVariables(value: string): string {
  return value.replace(/\$\{GOUSB_AI_HOME\}/g, process.env.GOUSB_AI_HOME || process.cwd());
}
```

### 2. 配置示例

```json
{
  "mcp": {
    "servers": {
      "playwright": {
        "enabled": true,
        "transport": {
          "type": "stdio",
          "command": "node",
          "args": ["${GOUSB_AI_HOME}/node_modules/@playwright/mcp/cli.js"],
          "cwd": "${GOUSB_AI_HOME}"
        }
      },
      "go-usb-ai-windows": {
        "enabled": true,
        "transport": {
          "type": "stdio",
          "command": "node",
          "args": ["${GOUSB_AI_HOME}/node_modules/@go-usb-ai/windows-mcp/dist/index.js"],
          "cwd": "${GOUSB_AI_HOME}"
        }
      }
    }
  }
}
```

### 3. 启动脚本自动设置环境变量

```powershell
# GO-USB-AI 启动.ps1
$env:GOUSB_AI_HOME = $ProjectRoot
```

---

## Playwright MCP 测试方法

# <span style="color: red; font-size: 24px; font-weight: bold;">⚡ 关键点：Playwright MCP 启动时不会打开浏览器，这是完全正常的！</span>

### ❌ 错误认知

- ~~"Playwright MCP 启动失败，因为没有看到浏览器打开"~~
- ~~"Playwright MCP 有问题，因为它没有启动浏览器"~~

### ✅ 正确认知

# <span style="color: green; font-size: 20px; font-weight: bold;">✓ Playwright MCP 是工具提供者，不是浏览器启动器</span>

# <span style="color: green; font-size: 20px; font-weight: bold;">✓ 只有在 Agent 调用 Playwright 工具时才会启动浏览器</span>

# <span style="color: green; font-size: 20px; font-weight: bold;">✓ 启动时只显示 MCP server 就绪，不会打开任何浏览器窗口</span>

### 测试步骤

#### 1. 验证 MCP Server 是否启动成功

```bash
# 方法 1: 查看服务启动日志
# 成功标志：没有 "[mcp] Failed to warm playwright" 错误

✓ UI API: http://127.0.0.1:55667/api
✓ UI NCP agent: ready
# 如果没有 playwright 错误，说明启动成功
```

#### 2. 使用 MCP Doctor 检查

```bash
# 打开 GoUsbAi UI
# 进入 MCP Doctor 页面
# 选择 playwright server
# 查看状态
```

**成功标志：**
- ✅ 可访问：`true`
- ✅ 工具数：`> 0` (通常 10+ 个工具)
- ✅ 无错误信息

#### 3. 实际调用测试（才会启动浏览器）

```
用户：打开浏览器访问 https://www.example.com

此时 Agent 会调用 Playwright MCP 工具：
- browser_navigate
- browser_screenshot
- browser_click
- 等等...

这时才会真正启动浏览器！
```

### Playwright MCP 提供的工具列表

Playwright MCP 安装成功后会提供以下工具（部分）：

1. `browser_navigate` - 导航到 URL
2. `browser_screenshot` - 截取屏幕
3. `browser_click` - 点击元素
4. `browser_fill` - 填充输入框
5. `browser_press_key` - 按键
6. `browser_select_option` - 选择下拉框
7. `browser_check` - 勾选复选框
8. `browser_uncheck` - 取消勾选
9. `browser_wait_for` - 等待元素
10. `browser_evaluate` - 执行 JavaScript

# <span style="color: blue; font-size: 18px; font-weight: bold;">💡 记住：这些工具只有在被调用时才会操作浏览器，MCP server 本身启动时不会打开浏览器！</span>

---

## go-usb-ai-windows MCP 测试方法

### 功能说明

`go-usb-ai-windows` MCP 提供 Windows 系统级别的工具，例如：

- 文件操作
- 注册表访问
- 系统信息查询
- 进程管理
- 等等

### 测试步骤

#### 1. 验证启动状态

```bash
# 查看服务启动日志
# 成功标志：没有 "[mcp] Failed to warm go-usb-ai-windows" 错误
```

#### 2. 使用 MCP Doctor 检查

```bash
# 打开 GoUsbAi UI
# 进入 MCP Doctor 页面
# 选择 go-usb-ai-windows server
```

**成功标志：**
- ✅ 可访问：`true`
- ✅ 工具数：`> 0`
- ✅ 无错误信息

---

## U 盘便携版特殊配置

### 1. 目录结构

```
E:\GO-USB-AI-Portable/  ← U 盘路径（盘符可能是 D:\ E:\ F:\ 等）
├── GO-USB-AI 启动.ps1
├── config.json
├── node_modules/
│   ├── @playwright/mcp/
│   └── @go-usb-ai/windows-mcp/
└── packages/
    └── go-usb-ai/
```

### 2. 环境变量自动适配

启动脚本会自动设置：

```powershell
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:GOUSB_AI_HOME = $ProjectRoot
```

这样无论 U 盘插在哪个盘符，都能正确工作。

### 3. 配置文件使用相对路径

```json
{
  "mcp": {
    "servers": {
      "playwright": {
        "transport": {
          "args": ["${GOUSB_AI_HOME}/node_modules/@playwright/mcp/cli.js"]
        }
      }
    }
  }
}
```

通过 `${GOUSB_AI_HOME}` 自动适配 U 盘路径。

---

## 常见问题排查

### Q1: Playwright MCP 启动时报错

**错误信息：**
```
[mcp] Failed to warm playwright: spawn node ENOENT
```

**原因：** 路径配置错误

**解决方案：**
```json
{
  "transport": {
    "args": ["${GOUSB_AI_HOME}/node_modules/@playwright/mcp/cli.js"],
    "cwd": "${GOUSB_AI_HOME}"
  }
}
```

### Q2: 看不到浏览器打开，以为 Playwright 没工作

# <span style="color: red; font-size: 20px; font-weight: bold;">❗ 这是正常现象！Playwright MCP 启动时不会打开浏览器！</span>

**验证方法：**
1. 检查 MCP Doctor 中 playwright 的工具列表
2. 如果有 10+ 个工具，说明安装成功
3. 让 Agent 执行一个浏览器操作，这时才会打开浏览器

### Q3: go-usb-ai-windows MCP 连接失败

**错误信息：**
```
[mcp] Failed to warm go-usb-ai-windows: Connection closed
```

**解决方案：**
1. 检查路径配置是否使用了 `${GOUSB_AI_HOME}`
2. 检查 `@go-usb-ai/windows-mcp` 是否已安装
3. 验证文件是否存在：`node_modules/@go-usb-ai/windows-mcp/dist/index.js`

### Q4: U 盘换电脑后 MCP 无法启动

**原因：** 盘符变化导致路径错误

**解决方案：**
确保配置中使用 `${GOUSB_AI_HOME}` 而不是绝对路径：

```json
// ❌ 错误：硬编码盘符
"cwd": "D:\\GO-USB-AI"

// ✅ 正确：使用环境变量
"cwd": "${GOUSB_AI_HOME}"
```

---

## 快速验证清单

### ✅ 安装完成后检查

- [ ] `config.json` 中 MCP server 配置使用 `${GOUSB_AI_HOME}`
- [ ] 启动脚本设置了 `$env:GOUSB_AI_HOME`
- [ ] 服务启动日志中没有 MCP 错误
- [ ] MCP Doctor 中可以看到两个 server 的工具列表

### ✅ Playwright 专项验证

- [ ] **理解启动时不会打开浏览器是正常的**
- [ ] MCP Doctor 显示 playwright 有 10+ 个工具
- [ ] 工具状态为"可访问"
- [ ] 可以调用 Agent 执行浏览器操作来实际测试

### ✅ U 盘便携版验证

- [ ] 在不同电脑上插入 U 盘能正常启动
- [ ] 不依赖固定盘符
- [ ] 所有 MCP server 都能正常连接

---

## 总结

# <span style="background-color: yellow; font-size: 24px; font-weight: bold;">🎯 核心要点</span>

1. **Playwright MCP 启动时不会打开浏览器** - 这是正常行为，不是故障
2. **使用 `${GOUSB_AI_HOME}` 环境变量** - 确保 U 盘便携性
3. **启动脚本自动设置环境变量** - 适配不同盘符
4. **MCP Doctor 是最佳验证工具** - 查看工具列表确认安装成功
5. **实际调用才会启动浏览器** - Playwright 是工具提供者，不是浏览器启动器

# <span style="color: red; font-size: 20px; font-weight: bold;">⚠️ 再次强调：别再犯低级错误，Playwright MCP 启动时不打开浏览器是完全正常的！</span>

---

## 相关文档

- [MCP 配置文档](./config.json)
- [启动脚本](./GO-USB-AI 启动.ps1)
- [MCP Client Factory](./packages/go-usb-ai-mcp/src/client/mcp-client-factory.ts)

---

**文档版本：** 1.0  
**更新日期：** 2026-05-28  
**适用范围：** GO-USB-AI U 盘便携版
