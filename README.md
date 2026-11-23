# Rei

这个仓库包含两个部分：

| 文件夹 | 是什么 | 说明 |
| --- | --- | --- |
| [`rei/`](rei/) | Rei 前端项目 | 用 React + TypeScript + Vite 搭建，目前还是起步阶段的骨架页面 |
| [`rei-theme/`](rei-theme/) | Claude Code 的 mod | 和风主题、风铃音效，以及仪表板、小春、工具箱三个面板 |

## rei：前端项目

```bash
cd rei
npm install
npm run dev
```

技术栈、常用命令和目录结构见 [`rei/README.md`](rei/README.md)。

## rei-theme：Claude Code mod

给 Claude Code 换上一套和风外观，并在聊天旁边加上三个面板：

- 📊 **仪表板**：本次会话的对话次数、工具调用、改动文件、用时（`/rei-dashboard`）
- 🦊 **小春 Koharu**：陪你写代码的狐狸少女，有 10 种心情，会跟着 Claude 的工作做反应，也能跟你聊天（`/koharu`）
- 🧰 **工具箱**：看看装了哪些插件、连接器、工具，哪些用过（`/rei-toolbox`）

在终端的 Claude Code 里安装：

```
/plugin install rei-theme --marketplace ShizuyaRei917/Rei
```

完整说明、声音设置和文件结构见 [`rei-theme/README.md`](rei-theme/README.md)。

## 仓库结构

```
Rei/
├── .claude-plugin/
│   └── marketplace.json   # 让 rei-theme 可以用 /plugin install 安装
├── rei/                   # 前端项目
└── rei-theme/             # Claude Code mod
```
