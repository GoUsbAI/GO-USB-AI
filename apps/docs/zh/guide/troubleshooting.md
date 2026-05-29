# 故障排查

排错页用于恢复问题，不是学习主路径。遇到异常时，先按下面顺序缩小范围。

## 1. 服务是否在运行

```bash
go-usb-ai status
go-usb-ai doctor
```

如果服务没有运行，先执行：

```bash
go-usb-ai start
```

如果状态异常，再尝试：

```bash
go-usb-ai restart
```

## 2. UI 打不开

检查：

- 地址是否是 `http://127.0.0.1:55667`
- 服务是否真的已启动
- 端口是否被占用
- 日志里是否有启动错误

## 3. 模型没有回复

检查：

- provider 是否保存成功
- API Key 或登录状态是否有效
- 默认模型是否存在
- 当前网络是否能访问 provider

## 4. 渠道连不上

检查：

- token 是否过期
- 渠道权限是否完整
- 平台回调或网络是否可达
- `go-usb-ai channels status` 是否显示异常

## 5. 自动化没有触发

检查：

- job 是否启用
- 时间表达是否符合预期
- 服务是否在计划触发时运行
- 任务是否绑定了错误的会话

## 常用诊断命令

```bash
go-usb-ai status --verbose
go-usb-ai doctor --verbose
go-usb-ai service autostart doctor
go-usb-ai remote doctor
```

## 仍然无法定位

带着下面信息再反馈问题：

- GoUsbAi 版本
- 操作系统
- 安装方式
- `go-usb-ai status` 输出
- `go-usb-ai doctor` 输出
- 复现步骤
