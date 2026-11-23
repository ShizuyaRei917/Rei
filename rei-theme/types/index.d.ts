export type Stats = {
  prompts: number
  tools: Record<string, number>
  files: string[]
  last: string
}

export type Mood = 'happy' | 'think' | 'worry' | 'sleepy' | 'cheer' | 'angry' | 'pout' | 'love' | 'sing' | 'curious'

export type ChatLine = { who: 'me' | 'koharu'; text: string }

export type Companion = {
  mood: Mood
  line: string
  chat: ChatLine[]
  isReplying: boolean
  form?: 'fox' | 'human'
  isMuted?: boolean
}

export type Heartbeat = {
  loadedAt: number
  events: number
  lastEvent: string
  lastAt: number
  refreshed: number
  tab?: 'home' | 'panels' | 'plugins' | 'connectors' | 'builtin'
  surfaces?: Record<string, number>
}

declare module 'claude-code' {
  interface PluginState {
    'rei-theme': { stats: Shaped<Stats>; companion: Shaped<Companion>; heartbeat: Shaped<Heartbeat> }
  }
}
