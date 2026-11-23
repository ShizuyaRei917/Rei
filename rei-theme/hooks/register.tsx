import { atom, read, update } from 'claude-code'
import type { Register, ThemeMessageRule, ThemeSetArgs, ThemeSound } from 'claude-code'

import type { Stats } from '../types'
import { makeColors } from './make-colors.js'
import { SCENE } from './scene.js'
import { registerToolbox, toolboxBeat, toolboxRecord, toolboxStart } from './toolbox.js'
import { koharuOnPrompt, koharuOnTool, koharuStart, registerKoharu } from './koharu.js'

// 和風: kinari washi and sumi ink by day, a lamp-lit night by dark.
// Accent ai-iro (indigo), danger shu (vermilion), success matcha,
// warning yamabuki, pro fuji (wisteria).
const { theme, problems } = makeColors({
  label: 'Rei 和風',
  roles: { accent: '#274a78', danger: '#c8473a', success: '#5f7f34', warning: '#c08a1e', pro: '#7a5a9a' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#ece3cf',
        'surface-1': '#f3ecdc',
        'surface-2': '#f9f5ea',
        'text-primary': '#211d19',
        'text-secondary': '#4a4239',
        'text-muted': '#615749',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#17151a',
        'surface-1': '#1e1c21',
        'surface-2': '#25222a',
        'surface-3': '#2c2931',
        'text-primary': '#efe8da',
        'text-secondary': '#cbc2b2',
        'text-muted': '#a69d8e',
      },
    },
  },
})

// Dashboard cards: square-cornered, bordered panels with a soft shadow.
const card: ThemeMessageRule = {
  backgroundColor: 'surface-1',
  borderColor: 'border-strong',
  borderWidth: 1,
  radius: 4,
  padding: 16,
  shadow: { y: 1, blur: 4, color: '#0000001a' },
}

const BASE: ThemeSetArgs = { colors: theme, backdrop: { scene: 'seigaiha' } }

const LOOK: ThemeSetArgs = {
  ...BASE,
  style: {
    Text: { fontFamily: ['serif'], fontSize: 15, lineHeight: 24 },
    Heading: { fontFamily: ['serif'], fontWeight: 'semibold', letterSpacing: 1 },
    UserMessage: { ...card, backgroundColor: 'surface-2', borderColor: 'border-accent' },
    AssistantMessage: card,
    ToolUse: { backgroundColor: 'surface-2', radius: 3, paddingX: 8 },
  },
}

// 小春's sounds, made by the desktop app itself once the person presses the speaker in the title bar.
// Soft and sparse: a wind chime (風鈴) and a breeze, and little chirps of hers at each moment.
const SOUND: ThemeSound = {
  ambience: {
    layers: [
      // 風鈴: pentatonic glass bells, now and then.
      { wave: 'bell', notes: ['E6', 'G6', 'A6', 'C7', 'D7', 'E7'], scatter: 0.1, gain: 0.12, release: 2.4, pan: 0.3 },
      { wave: 'bell', notes: ['A5', 'C6', 'D6', 'E6'], scatter: 0.05, gain: 0.08, release: 2.8, pan: -0.4 },
      // A breeze through the eaves.
      { wave: 'pink', drone: true, gain: 0.05, filter: { type: 'lowpass', hz: 500, to: 1100 }, tremolo: { hz: 0.08, depth: 0.6 } },
    ],
    reverb: 0.45,
  },
  cues: {
    // ぴょん: a little hop up when you send.
    send: { layers: [{ wave: 'triangle', notes: ['E6'], glide: 5, gain: 0.35, attack: 0.005, release: 0.14 }] },
    // A tiny tap for each tool call: kept very quiet.
    tool: { layers: [{ wave: 'sine', notes: ['A6'], gain: 0.12, release: 0.05 }] },
    // きゅっきゅ～: a happy chirp and one chime when Claude finishes.
    done: {
      layers: [
        { wave: 'sine', notes: ['C6', 'E6', 'G6'], step: 0.08, glide: 3, gain: 0.3, release: 0.12 },
        { wave: 'bell', notes: [0, 'C7'], step: 0.24, gain: 0.18, release: 1.4 },
      ],
      reverb: 0.3,
    },
    // ん？: a questioning rise when a question or a permission waits.
    ask: { layers: [{ wave: 'sine', notes: ['E5', 'A5'], step: 0.16, glide: 4, gain: 0.3, release: 0.2 }] },
    // ふぇ～: a small sad fall on an error.
    error: { layers: [{ wave: 'triangle', notes: ['A5', 'E5'], step: 0.18, glide: -3, gain: 0.28, release: 0.3 }] },
    // さらさら: a soft sweep when the conversation is compacted.
    compact: { layers: [{ wave: 'pink', gain: 0.2, attack: 0.2, release: 0.8, filter: { type: 'bandpass', hz: 600, to: 3000 } }] },
    // Clicking the backdrop rings the wind chime, low on the left to high on the right.
    click: { layers: [{ wave: 'bell', notes: ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7'], gain: 0.25, release: 1.6 }], reverb: 0.4 },
  },
}

const PANE = 'rei-dashboard'
const EMPTY: Stats = { prompts: 0, tools: {}, files: [], last: '—' }
const stats = atom({ plugin: 'rei-theme', key: 'stats' } as const, EMPTY, { shape: 'stats-1' })

export const register: Register = on => {
  registerKoharu(on)
  registerToolbox(on)

  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    // Try the whole look, then without sound, then without style: an older app refuses what it lacks.
    let set
    let soundNote: string
    try {
      set = await $.theme.set({ ...LOOK, sound: SOUND })
      soundNote = '🔔 小春的声音已载入：点标题栏的喇叭图标打开'
    } catch (error) {
      soundNote = `🔕 声音没有载入：${String(error).slice(0, 160)}`
      $.ui.log(String(error))
      try {
        set = await $.theme.set(LOOK)
      } catch (again) {
        $.ui.log(String(again))
        set = await $.theme.set(BASE)
      }
    }
    $.ui.toast(soundNote)
    $.ui.log(soundNote)
    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    await $.command.register({ name: 'rei-dashboard', description: 'Open the Rei session dashboard pane' })
    void $.ui.open({ id: PANE, title: '仪表板 Dashboard' })
    // The console pane was removed: close it if an earlier version left it open.
    void $.ui.close({ id: 'rei-console' })
    await koharuStart($)
    await toolboxStart($)
    void toolboxBeat($, 'session.start')

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={SCENE} alt="Seigaiha waves, a pale sun and drifting petals" />
  })

  on('command.run', { command: 'rei-dashboard' }, async $ => {
    await $.ui.open({ id: PANE, title: '仪表板 Dashboard' })

    return { text: 'Dashboard opened.' }
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, stats, s => ({ ...s, prompts: s.prompts + 1 }))
    void koharuOnPrompt($)
    void toolboxBeat($, 'prompt.submit')

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const path = e.tool === 'Edit' || e.tool === 'Write' ? e.file_path : undefined
    await update($, stats, s => ({
      ...s,
      last: e.tool,
      tools: { ...s.tools, [e.tool]: (s.tools[e.tool] ?? 0) + 1 },
      files: path !== undefined && !s.files.includes(path) ? [...s.files, path].slice(-50) : s.files,
    }))
    const result = await next(e)
    void koharuOnTool($, e.tool)
    void toolboxBeat($, `tool.call ${e.tool}`)
    void toolboxRecord($, e.tool, e.tool === 'Skill' ? e.skill : undefined)

    return result
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const s = await read($, stats)
    const usage = await $.session.usage()
    const now = await $.clock.now()
    const minutes = Math.max(0, Math.round((now - usage.startedAt) / 60000))
    const calls = Object.values(s.tools).reduce((a, b) => a + b, 0)
    const top = Object.entries(s.tools).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const context = usage.context.percent

    const Tile = (p: { label: string; value: string }) => (
      <Box flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1} flexGrow={1} minWidth={12}>
        <Text dimColor size="caption">{p.label}</Text>
        <Text weight="bold" size="title">{p.value}</Text>
      </Box>
    )

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          <Tile label="对话 Prompts" value={String(s.prompts)} />
          <Tile label="工具 Tool calls" value={String(calls)} />
          <Tile label="文件 Files" value={String(s.files.length)} />
          <Tile label="时间 Minutes" value={String(minutes)} />
          <Tile label="上下文 Context" value={context === undefined || context === null ? '—' : `${Math.round(context)}%`} />
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1}>
          <Text weight="semibold">常用工具 Top tools</Text>
          {top.length === 0 && <Text dimColor>还没有工具调用</Text>}
          {top.map(([name, count]) => (
            <Box flexDirection="row" justifyContent="space-between">
              <Text>{name}</Text>
              <Text dimColor>{String(count)}</Text>
            </Box>
          ))}
          <Text dimColor size="caption">最近 Last: {s.last}</Text>
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1}>
          <Text weight="semibold">改动的文件 Files touched</Text>
          {s.files.length === 0 && <Text dimColor>还没有</Text>}
          {s.files.slice(-8).map(f => (
            <Text dimColor>{f.split('/').slice(-2).join('/')}</Text>
          ))}
        </Box>
      </Box>
    )
  })
}
