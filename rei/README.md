# Rei

Rei 是一个用 **React + TypeScript + Vite** 搭建的前端项目。

> 目前处于**起步阶段**：仓库里只有 Vite 官方模板生成的骨架页面（一个计数按钮和文档链接），还没有 Rei 自己的功能。

## 技术栈

| 用途 | 工具 | 版本 |
| --- | --- | --- |
| 界面 | [React](https://react.dev/) | 19 |
| 语言 | [TypeScript](https://www.typescriptlang.org/) | 6.0 |
| 开发服务器与打包 | [Vite](https://vite.dev/) + `@vitejs/plugin-react` | 8 |
| 代码检查 | [Oxlint](https://oxc.rs/) | 1.x |

## 快速开始

需要先装好 [Node.js](https://nodejs.org/)（建议 22 或更新版本）。

```bash
npm install
```

```bash
npm run dev
```

打开终端里显示的地址（默认是 http://localhost:5173），修改 `src/App.tsx` 并保存，页面会立刻更新。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器，改代码会自动刷新 |
| `npm run build` | 先用 TypeScript 检查类型，再打包到 `dist/` |
| `npm run preview` | 在本地预览打包后的 `dist/` |
| `npm run lint` | 用 Oxlint 检查代码 |

## 目录结构

```
rei/
├── index.html          # 页面入口，网页标题是 "Rei"
├── public/             # 原样复制到网站根目录的文件
│   ├── favicon.svg     # 网页图标
│   └── icons.svg       # 页面用到的图标集
├── src/
│   ├── main.tsx        # 程序入口：把 <App /> 挂载到页面上
│   ├── App.tsx         # 主组件（目前是模板示例页）
│   ├── App.css         # 主组件的样式
│   ├── index.css       # 全局样式
│   └── assets/         # 在代码里 import 的图片
├── vite.config.ts      # Vite 设置
├── tsconfig*.json      # TypeScript 设置（app 给 src/，node 给配置文件）
└── .oxlintrc.json      # Oxlint 规则
```

## 项目设置说明

- **TypeScript**：开了严格的未使用变量和参数检查（`noUnusedLocals`、`noUnusedParameters`），`npm run build` 时类型有错会直接失败。
- **Oxlint**：启用了 `react`、`typescript`、`oxc` 三组规则，另外强制遵守 Hooks 规则（`react/rules-of-hooks`）。
- **React Compiler**：没有开启，因为会拖慢开发和打包速度。需要时可参考[官方说明](https://react.dev/learn/react-compiler/installation)。

## 接下来

- [ ] 把 `src/App.tsx` 的模板示例换成 Rei 自己的页面
- [ ] 删除用不到的模板图片（`src/assets/`、`public/icons.svg`）
