# 命令索引

这是查询型参考页，不是新手入门路径。  
如果你只是第一次安装和启动，请先看 [快速开始](/zh/guide/getting-started)。

## 核心运行

| 命令 | 用途 |
|------|------|
| `go-usb-ai start` | 后台启动服务和 UI |
| `go-usb-ai restart` | 重启服务 |
| `go-usb-ai stop` | 停止服务 |
| `go-usb-ai serve` | 前台运行，适合调试 |
| `go-usb-ai status` | 查看运行状态 |
| `go-usb-ai doctor` | 运行诊断 |
| `go-usb-ai update` | 更新运行时 |
| `go-usb-ai usage` | 查看使用快照 |

## 宿主托管

| 命令 | 用途 |
|------|------|
| `go-usb-ai service install-systemd --user` | 安装 Linux 用户级 systemd 服务 |
| `sudo go-usb-ai service install-systemd --system` | 安装 Linux 系统级 systemd 服务 |
| `go-usb-ai service install-launch-agent` | 安装 macOS LaunchAgent |
| `go-usb-ai service install-task` | 安装 Windows 计划任务 |
| `go-usb-ai service autostart status` | 查看自启动状态 |
| `go-usb-ai service autostart doctor` | 诊断自启动配置 |

## 远程访问

| 命令 | 用途 |
|------|------|
| `go-usb-ai remote enable` | 启用远程访问 |
| `go-usb-ai remote disable` | 关闭远程访问 |
| `go-usb-ai remote status` | 查看远程访问状态 |
| `go-usb-ai remote doctor` | 诊断远程访问 |

## 配置

| 命令 | 用途 |
|------|------|
| `go-usb-ai config get <path>` | 读取配置 |
| `go-usb-ai config set <path> <value>` | 写入配置 |
| `go-usb-ai config unset <path>` | 删除配置 |

## 密钥

| 命令 | 用途 |
|------|------|
| `go-usb-ai secrets audit` | 审计密钥引用 |
| `go-usb-ai secrets configure` | 配置密钥提供方式 |
| `go-usb-ai secrets reload` | 重载密钥 |

## 渠道

| 命令 | 用途 |
|------|------|
| `go-usb-ai channels status` | 查看渠道状态 |
| `go-usb-ai channels login` | 登录支持扫码的渠道 |
| `go-usb-ai channels add` | 添加渠道配置 |

## 自动化

| 命令 | 用途 |
|------|------|
| `go-usb-ai cron list` | 列出任务 |
| `go-usb-ai cron add` | 添加任务 |
| `go-usb-ai cron remove <jobId>` | 删除任务 |
| `go-usb-ai cron enable <jobId>` | 启用任务 |
| `go-usb-ai cron disable <jobId>` | 禁用任务 |
| `go-usb-ai cron run <jobId>` | 立即运行任务 |

## 扩展与 Skills

| 命令 | 用途 |
|------|------|
| `go-usb-ai plugins list` | 列出插件 |
| `go-usb-ai plugins install <spec>` | 安装插件 |
| `go-usb-ai plugins enable <id>` | 启用插件 |
| `go-usb-ai skills installed` | 列出已安装 skill |
| `go-usb-ai marketplace skills search` | 搜索 marketplace skill |
| `go-usb-ai marketplace skills install <slug>` | 安装 marketplace skill |

## Agent

| 命令 | 用途 |
|------|------|
| `go-usb-ai agent` | 终端交互 |
| `go-usb-ai agent -m "message"` | 发送一次性消息 |
| `go-usb-ai agents list` | 列出 Agent |
| `go-usb-ai agents runtimes` | 列出 runtime |

## 相关文档

- [核心命令](/zh/guide/core-commands)
- [故障排查](/zh/guide/troubleshooting)
- [运行与托管](/zh/guide/runtime-hosting)
