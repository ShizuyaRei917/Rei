# rei-theme

给 Claude Code 用的 mod：一套和风主题，加上三个放在聊天旁边的面板。主题和面板都在 Claude 桌面 App 里显示得最完整。

## 里面有什么

| 部分 | 说明 | 打开方式 |
| --- | --- | --- |
| 🎎 和风主题 | 米色和纸配墨色文字（深色模式是暖调墨夜），青海波背景，樱花花瓣，卡片式消息 | 自动套用 |
| 🔔 主题音效 | 风铃背景声，以及发消息、完成、出错、等你确认时小春风格的提示音 | 点会话标题栏的喇叭图标 |
| 📊 仪表板 | 本次会话的对话次数、工具调用、改动文件、用时、上下文用量 | `/rei-dashboard` |
| 🦊 小春 Koharu | 陪你写代码的狐狸少女：10 种心情和动作，会跟着 Claude 的工作做反应，闲着时会自言自语，可以聊天、摸头、戳她，也能变成小狐狸 | `/rei-koharu`（或 `/koharu`） |
| 🧰 工具箱 | 列出装了哪些插件、连接器、工具，哪些用过、哪些没用过，以及这个 mod 有没有在正常运行 | `/rei-toolbox` |

## 安装

在终端的 Claude Code 里输入：

```
/plugin install rei-theme --marketplace ShizuyaRei917/Rei
```

提示 `Add marketplace?` 时输入 `y`，再选安装范围。

在 shell 里：

```bash
claude plugin install rei-theme --marketplace ShizuyaRei917/Rei
```

在桌面 App 里（`/plugin` 不能用时）：点输入框旁边的 **+** → **Plugins** → **Add marketplace**，填 `ShizuyaRei917/Rei`，再 **Add plugin**。

这个仓库如果是私有的，只有能在 GitHub 上读取它、而且电脑上已经设好 GitHub 凭证（SSH key，或者 `gh auth login` 后再 `gh auth setup-git`）的人才能安装。

开发时也可以直接从文件夹加载：

```bash
claude --plugin-dir ./rei-theme
```

## 关于声音

- **主题音效**（风铃和提示音）由桌面 App 在你的电脑上合成播放，云端会话也能听到。
- **小春面板的叫声和说话**由运行 Claude Code 的那台机器播放：在 Mac 上本地运行时会响，在云端会话或 Linux 终端里不会出声。面板里的 🔊 按钮可以让她静音。
- 和小春聊天会调用 Haiku 模型生成回复，费用算在你的账户用量里。

## 文件结构

```
rei-theme/
├── .claude-plugin/plugin.json   # mod 的名字、版本、说明
├── hooks/
│   ├── hooks.json               # 指向 register.tsx
│   ├── register.tsx             # 入口：主题、音效、仪表板，并接上其他部分
│   ├── koharu.tsx               # 小春面板：心情、聊天、闲置小动作、声音
│   ├── koharu-art.ts            # 小春的画：小狐狸矢量图、动作和特效
│   ├── toolbox.tsx              # 工具箱面板
│   ├── scene.ts                 # 青海波和樱花的背景
│   └── make-colors.js / .d.ts   # 配色生成工具（来自 Claude Code，请勿修改）
├── types/index.d.ts             # 面板共享状态的类型
├── assets/
│   ├── koharu/                  # 小春的 5 张表情图（.webp 给 App，.png 给终端，.svg 是纯矢量备用）
│   │   └── vectorize.py         # 把表情图转成纯矢量 SVG 的脚本
│   └── voice/                   # 小春 10 种心情的叫声
│       └── make-voice.py        # 生成叫声的脚本
└── tsconfig.json
```

## 修改与检查

```bash
claude plugin validate ./rei-theme
```

加载过一次后，Claude Code 会在 `.claude-plugin/types/` 生成类型文件（已在 `.gitignore` 里），之后就能做类型检查：

```bash
tsc -p ./rei-theme
```

换了小春的表情图之后，重新生成矢量备用图：

```bash
python3 rei-theme/assets/koharu/vectorize.py rei-theme/assets/koharu rei-theme/assets/koharu 116 44
```

调整叫声之后重新生成：

```bash
python3 rei-theme/assets/voice/make-voice.py rei-theme/assets/voice
```
