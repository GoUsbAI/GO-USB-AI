# 后台运行与自启动

`go-usb-ai start` 可以让 GoUsbAi 跑起来，但它不等于系统级长期托管。

这一页讲什么时候需要后台运行和自启动，以及 NPM 安装版应该怎样显式开启。

## 什么时候需要它

你进入这些场景时，就应该考虑自启动：

- 每天都使用 GoUsbAi
- 希望登录后自动可用
- 不想每次重启机器后手动启动
- 已经接入聊天渠道或自动化任务

## NPM 安装不会自动注册自启动

```bash
npm i -g go-usb-ai
```

这条命令只安装 CLI。它不会偷偷修改系统启动项。

如果需要自启动，你必须显式安装宿主托管项。

## 按平台开启

Linux 用户级：

```bash
go-usb-ai service install-systemd --user
```

Linux 系统级：

```bash
sudo go-usb-ai service install-systemd --system
```

macOS：

```bash
go-usb-ai service install-launch-agent
```

Windows：

```bash
go-usb-ai service install-task
```

## 检查状态

```bash
go-usb-ai service autostart status
go-usb-ai service autostart doctor
```

## 什么时候不用自启动

如果你只是试用，或者只在本机 UI 偶尔打开，`go-usb-ai start` 就够了。

## 相关文档

- [运行与托管](/zh/guide/runtime-hosting)
- [远程访问](/zh/guide/remote-access)
- [命令索引](/zh/guide/commands)
