import { atom, read, update } from 'claude-code'
import type { CommandInfo, EngineInterface, On, ToolInfo } from 'claude-code'

import type { Heartbeat } from '../types'

export const TOOLBOX_PANE = 'rei-toolbox'
const TITLE = '工具箱 Toolbox'
const USAGE_KEY = 'usage-v1'

// The commands this mod registers: the self-check looks for each.
type Tab = NonNullable<Heartbeat['tab']>

// The panels this mod adds, written out for the Panels tab.
const PANELS = [
  { id: 'rei-dashboard', title: '仪表板 Dashboard', command: 'rei-dashboard', icon: '📊',
    what: '这次会话的数字：对话次数、工具调用、改动文件、用时、上下文用量' },
  { id: 'rei-koharu', title: '小春 Koharu', command: 'rei-koharu', icon: '🦊',
    what: '陪你写代码的小狐狸，可以聊天、摸头、变成人形' },
  { id: 'rei-toolbox', title: '工具箱 Toolbox', command: 'rei-toolbox', icon: '🧰',
    what: '就是这里：看装了什么、用了什么、mod 有没有在运行' },
]

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: '概览' },
  { id: 'panels', label: '面板' },
  { id: 'plugins', label: '插件' },
  { id: 'connectors', label: '连接器' },
  { id: 'builtin', label: '内置工具' },
]

const SURFACE_NAMES: Record<string, string> = { desktop: '电脑 App', mobile: '手机 App', terminal: '终端', vscode: 'VS Code' }

type Usage = Record<string, { count: number; last: number }>

const EMPTY: Heartbeat = { loadedAt: 0, events: 0, lastEvent: '—', lastAt: 0, refreshed: 0 }
const beat = atom({ plugin: 'rei-theme', key: 'heartbeat' } as const, EMPTY, { shape: 'heartbeat-1' })

const clock = (ms: number) => {
  if (ms === 0) {
    return '—'
  }
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function readUsage($: EngineInterface): Promise<Usage> {
  const raw = await $.store.get(USAGE_KEY)
  return raw !== null && typeof raw === 'object' ? (raw as Usage) : {}
}

// Every hook of the mod calls this: proof the mod is alive.
export async function toolboxBeat($: EngineInterface, event: string) {
  const now = await $.clock.now()
  await update($, beat, (b): Heartbeat => ({
    ...b, loadedAt: b.loadedAt === 0 ? now : b.loadedAt, events: b.events + 1, lastEvent: event, lastAt: now,
  }))
}

// Notes each device (surface) that asked the mod for a drawing, and when: shows whether a phone is attached.
export async function toolboxSeen($: EngineInterface, surface: string) {
  const b = await read($, beat)
  const now = await $.clock.now()
  const last = b.surfaces?.[surface] ?? 0
  if (now - last > 15000) {
    await update($, beat, (x): Heartbeat => ({ ...x, surfaces: { ...x.surfaces, [surface]: now } }))
  }
}

// Remembers which tools and skills get used, across sessions.
export async function toolboxRecord($: EngineInterface, tool: string, skill?: string) {
  const now = await $.clock.now()
  const usage = await readUsage($)
  for (const name of skill !== undefined ? [tool, `skill:${skill}`] : [tool]) {
    usage[name] = { count: (usage[name]?.count ?? 0) + 1, last: now }
  }
  await $.store.set(USAGE_KEY, usage)
}

export async function toolboxStart($: EngineInterface) {
  const now = await $.clock.now()
  await update($, beat, (b): Heartbeat => ({ ...b, loadedAt: now }))
  await $.command.register({ name: 'rei-toolbox', description: 'See every tool, plugin and connector, and what you use' })
}

const mcpServer = (name: string) => /^mcp__(.+?)__/.exec(name)?.[1] ?? '?'

export function registerToolbox(on: On) {
  on('command.run', { command: 'rei-toolbox' }, async $ => {
    await $.ui.open({ id: TOOLBOX_PANE, title: TITLE })

    return { text: 'Toolbox opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: TOOLBOX_PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const hb = await read($, beat)
    const usage = await readUsage($)
    const tools: ToolInfo[] = await $.tool.list()
    const commands: CommandInfo[] = await $.command.list()
    const used = (name: string) => usage[name]?.count ?? 0

    const mine = new Set(commands.map(c => c.name))
    const missing = PANELS.map(p => p.command).filter(name => !mine.has(name))

    // Plugins: commands and skills grouped by the plugin that brought them.
    const plugins = new Map<string, CommandInfo[]>()
    for (const c of commands) {
      if (c.source === 'plugin' || c.plugin !== undefined) {
        const key = c.plugin ?? '(plugin)'
        plugins.set(key, [...(plugins.get(key) ?? []), c])
      }
    }

    // Connectors: MCP tools grouped by server.
    const servers = new Map<string, ToolInfo[]>()
    for (const t of tools.filter(t => t.mcp)) {
      const key = mcpServer(t.name)
      servers.set(key, [...(servers.get(key) ?? []), t])
    }
    const builtins = tools.filter(t => !t.mcp)

    const section = (title: string, note: string, rows: JSX.Element[]) => (
      <Box flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1}>
        <Text weight="semibold">{title}</Text>
        <Text dimColor size="caption">{note}</Text>
        {rows}
      </Box>
    )

    const row = (key: string, label: string, detail: string, count: number) => (
      <Box key={key} flexDirection="row" justifyContent="space-between">
        <Text dimColor={count === 0}>{count > 0 ? '● ' : '○ '}{label}</Text>
        <Text dimColor size="caption">{detail}{count > 0 ? ` · 用过 ${count} 次` : ' · 未使用'}</Text>
      </Box>
    )

    const tab: Tab = hb.tab ?? 'home'
    const setTab = (next: Tab) => update($, beat, (b): Heartbeat => ({ ...b, tab: next }))
    const usedTools = tools.filter(t => used(t.name) > 0).length
    const unusedPlugins = [...plugins.entries()].filter(([, list]) => list.every(c => used(`skill:${c.name}`) === 0)).map(([n]) => n)
    const unusedServers = [...servers.entries()].filter(([, list]) => list.every(t => used(t.name) === 0)).map(([n]) => n)

    const status = (
      <Box flexDirection="column" borderStyle="round" borderColor={missing.length === 0 ? 'success' : 'warning'} paddingX={1}>
        <Text weight="bold" color={missing.length === 0 ? 'success' : 'warning'}>
          {missing.length === 0 ? '✓ rei-theme 正在运行' : '⚠ rei-theme 部分没有注册'}
        </Text>
        <Text dimColor size="caption">加载于 {clock(hb.loadedAt)}　·　钩子触发 {String(hb.events)} 次</Text>
        <Text dimColor size="caption">最近一次：{hb.lastEvent}（{clock(hb.lastAt)}）</Text>
        <Text dimColor size="caption">
          来要过画面的设备：{Object.keys(hb.surfaces ?? {}).length === 0 ? '还没有'
            : Object.entries(hb.surfaces ?? {}).map(([name, at]) => `${SURFACE_NAMES[name] ?? name}（${clock(at)}）`).join('、')}
        </Text>
      </Box>
    )

    const stat = (label: string, value: string, go: Tab) => (
      <Box key={`s-${go}`} flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1} flexGrow={1} minWidth={12}>
        <Text dimColor size="caption">{label}</Text>
        <Text weight="bold" size="title">{value}</Text>
        <Button key={`go-${go}`} label="查看 →" plain onPress={() => setTab(go)} />
      </Box>
    )

    const home = (
      <Box flexDirection="column" gap={1}>
        {status}
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          {stat('我的面板', String(PANELS.length), 'panels')}
          {stat('插件', String(plugins.size), 'plugins')}
          {stat('连接器', String(servers.size), 'connectors')}
          {stat('内置工具', `${usedTools}/${builtins.length}`, 'builtin')}
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1}>
          <Text weight="semibold">💡 可能用不到的</Text>
          {unusedPlugins.length + unusedServers.length === 0 && <Text dimColor>暂时没有：每个插件和连接器都用过了</Text>}
          {unusedPlugins.map(n => <Text key={`up-${n}`} dimColor>○ 插件　{n}</Text>)}
          {unusedServers.map(n => <Text key={`us-${n}`} dimColor>○ 连接器　{n}</Text>)}
          <Text dimColor size="caption">从工具箱装好起开始记录，多用几天会更准</Text>
        </Box>
      </Box>
    )

    const panels = (
      <Box flexDirection="column" gap={1}>
        {PANELS.map(p => (
          <Box key={`pn-${p.id}`} flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1}>
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              <Text weight="semibold">{p.icon} {p.title}</Text>
              <Button key={`open-${p.id}`} label="打开" onPress={() => $.ui.open({ id: p.id, title: p.title })} />
            </Box>
            <Text dimColor>{p.what}</Text>
            <Text dimColor size="caption">
              {mine.has(p.command) ? '✓' : '✗'} 命令 /{p.command}
            </Text>
          </Box>
        ))}
      </Box>
    )

    const body =
      tab === 'home' ? home
      : tab === 'panels' ? panels
      : tab === 'plugins' ? section(`插件 Plugins (${plugins.size})`, '装在这里的插件，以及它们带来的命令和技能',
          [...plugins.entries()].map(([name, list]) => {
            const count = list.reduce((n, c) => n + used(`skill:${c.name}`), 0)
            return row(`p-${name}`, name, `${list.length} 个命令/技能`, count)
          }))
      : tab === 'connectors' ? section(`连接器 Connectors (${servers.size})`, 'MCP 服务器：连到外部服务（GitHub、数据库……）的工具',
          [...servers.entries()].map(([name, list]) => {
            const count = list.reduce((n, t) => n + used(t.name), 0)
            return row(`m-${name}`, name, `${list.length} 个工具`, count)
          }))
      : section(`内置工具 Built-in (${builtins.length})`, 'Claude Code 自带的工具，用过的排在前面',
          [...builtins]
            .sort((a, b) => used(b.name) - used(a.name))
            .map(t => row(`b-${t.name}`, t.name, '', used(t.name))))

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          {TABS.map(t => (
            <Button key={`tab-${t.id}`} label={t.label} variant={t.id === tab ? 'primary' : 'secondary'} onPress={() => setTab(t.id)} />
          ))}
        </Box>

        {body}

        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          <Button key="refresh" label="刷新" onPress={() => update($, beat, (b): Heartbeat => ({ ...b, refreshed: b.refreshed + 1 }))} />
          <Button
            key="selftest"
            label="自检"
            onPress={async () => {
              const echo = await $.process.run(['echo', 'ok'])
              const ok = echo.stdout.trim() === 'ok' && missing.length === 0
              await toolboxBeat($, 'self-test')
              $.ui.toast(ok ? '✓ 自检通过：mod 在运行，命令都已注册' : `⚠ 自检有问题：缺少 ${missing.map(n => '/' + n).join(' ')}`)
            }}
          />
          <Button key="reset" label="清空使用记录" onPress={async () => {
            await $.store.delete(USAGE_KEY)
            await update($, beat, (b): Heartbeat => ({ ...b, refreshed: b.refreshed + 1 }))
          }} />
        </Box>
        {tab !== 'home' && tab !== 'panels' && <Text dimColor size="caption">● 用过　○ 还没用过</Text>}
      </Box>
    )
  })
}
