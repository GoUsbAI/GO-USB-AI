# GO-USB-AI

<p align="center">
  <img src="https://img.shields.io/badge/status-alpha-orange" alt="status">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="license">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey" alt="platform">
</p>

<p align="center">
  <b>🔌 即插即用的便携AI — 插上U盘，任何电脑秒变AI工作站</b>
</p>

---

## 💡 这是什么

**GO-USB-AI** 是一个完全自包含的便携AI助手。把它装进U盘，插到任意一台电脑上，就能立刻拥有一个私有的、离线可用的AI环境——不需要安装、不需要联网、不需要云端。

> *Plug in. Go. AI follows you everywhere.*

---

## ✨ 特性

- **🔌 真正的即插即用** — U盘插上就运行，拔掉不留痕迹
- **🔒 完全私有** — 所有数据留在U盘里，不上传云端
- **🌐 离线可用** — 不依赖网络，飞机上、地下室都能用
- **🖥️ 跨平台** — Windows / macOS / Linux 通吃
- **🧠 本地大模型** — 内置轻量级LLM，即刻对话
- **🛠️ 工具集成** — 邮件、代码、文档、日历、聊天，一站式
- **📦 零安装** — 不需要管理员权限，不需要装任何东西

---

## 🚀 快速开始

```bash
# 1. 准备一个 16GB+ 的 USB 3.0 U盘
# 2. 下载最新 release
# 3. 解压到 U 盘根目录
# 4. 插上电脑，双击 run.bat (Windows) 或 run.sh (macOS/Linux)
# 5. 浏览器打开 http://localhost:7860
```

> ⚡ 从插上到开始使用，不超过 30 秒。

---

## 🏗️ 架构

```
┌──────────────────────────────────────┐
│              GO-USB-AI                │
├──────────┬──────────┬────────────────┤
│  Web UI  │  Agent   │  Local LLM     │
│  (对话界面) │  (工具调度) │  (本地推理引擎)   │
├──────────┴──────────┴────────────────┤
│          Memory Tree 记忆树           │
├──────────────────────────────────────┤
│        USB Storage 持久化存储          │
└──────────────────────────────────────┘
```

---

## 📋 路线图

- [ ] v0.1 — 基础对话 + 本地LLM
- [ ] v0.3 — 记忆树系统（Memory Tree）
- [ ] v0.5 — 代码助手 + 文档解析
- [ ] v0.7 — 邮件/日历/聊天集成
- [ ] v0.9 — 多Agent协作
- [ ] v1.0 — 完整便携AI生态

---

## 🤝 贡献

欢迎提 Issue 和 PR！

```bash
git clone https://github.com/GoUsbAI/GO-USB-AI.git
cd GO-USB-AI
```

---

## 📄 许可证

[MIT License](LICENSE) © 2026 GoUsbAI

---

<p align="center">
  <sub>Built with ❤️ for everyone who needs AI without boundaries.</sub>
</p>
