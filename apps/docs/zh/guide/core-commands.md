# 核心命令

这页只放普通用户最常用的少量命令。完整命令请看 [命令索引](/zh/guide/commands)。

## 启动与停止

```bash
go-usb-ai start
go-usb-ai restart
go-usb-ai stop
```

## 状态与诊断

```bash
go-usb-ai status
go-usb-ai doctor
```

## 版本与更新

```bash
go-usb-ai --version
go-usb-ai update
```

## 自启动检查

```bash
go-usb-ai service autostart status
go-usb-ai service autostart doctor
```

## 远程访问检查

```bash
go-usb-ai remote status
go-usb-ai remote doctor
```

## 使用原则

第一次上手只需要 `start`、`status`、`doctor`、`stop`。  
其他命令只有在对应场景需要时再查。
