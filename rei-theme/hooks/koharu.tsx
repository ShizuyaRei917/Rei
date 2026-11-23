import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { ChatLine, Companion, Mood } from '../types'
import { koharu, picture, PICTURE_PAD, POSE } from './koharu-art.js'
import type { Pose } from './koharu-art.js'
import { toolboxBeat, toolboxSeen } from './toolbox.js'

export const KOHARU_PANE = 'rei-koharu'
const TITLE = '小春 Koharu'
const MODEL = 'claude-haiku-5-5'

const EMPTY: Companion = { mood: 'happy', line: '你好呀～我是小春！有什么想聊的吗？', chat: [], isReplying: false }
const state = atom({ plugin: 'rei-theme', key: 'companion' } as const, EMPTY, { shape: 'companion-1' })

const PERSONA = [
  '你是「小春」(Koharu)，住在开发者编辑器旁边的狐狸精灵少女：淡紫银色长发、紫色眼睛、白色狐狸耳朵和蓬松尾巴，穿藏青色水手领针织开衫、红色领结，头上戴黑色蝴蝶结和樱花流苏发饰。也能变回圆滚滚的小狐狸。',
  '性格：温柔、元气、有点小迷糊，偶尔有点小傲娇（会嘴硬、鼓脸），喜欢和风的东西（樱花、抹茶、风铃）。',
  '你陪着主人写一个叫 rei 的 Vite + React 项目，会给鼓励，偶尔给一点简单的编程小建议。',
  '用主人使用的语言回答（主人多用中文），口语化、可爱，偶尔加「～」或颜文字，但别太夸张。',
  '每次只说 1 到 3 句话，最多 80 个字。不要用 Markdown。',
  '回答最后一行另起一行写心情标签，只能是 [happy] [think] [worry] [sleepy] [cheer] [angry] [pout] [love] [sing] [curious] 其中一个。',
].join('\n')

const KAOMOJI: Record<Mood, string> = {
  happy: '(=^･ω･^=)', cheer: '(ﾉ≧∀≦)ﾉ', think: '(=･ω･=)…', worry: '(=>﹏<=)', sleepy: '(=-ω-=) zzz',
  angry: '(╬=｀ω´=)', pout: '(=｀^´=)', love: '(=♡ω♡=)', sing: '♪(=^ω^=)♪', curious: '(=･ω･=)？',
}

// The new look: the person's drawing as sharp WebP pictures (assets/koharu/<pose>.webp), wrapped in an
// SVG for the apps, and PNG for the terminal. The <pose>.svg files are a pure-vector fallback made by
// vectorize.py, used if a surface ever refuses the embedded picture. Read from the mod's folder once.
const SIZE: Record<Pose, [number, number]> = {
  angry: [320, 423], pout: [320, 444], fluster: [320, 443], happy: [320, 443], sleepy: [320, 444],
}
const USE_SHARP = true
const pictures = new Map<string, string>()

async function loadPicture($: EngineInterface, pose: Pose, kind: 'svg' | 'png' | 'webp'): Promise<string | undefined> {
  const key = `${pose}.${kind}`
  if (!pictures.has(key)) {
    try {
      const path = `${$.plugin.root}/assets/koharu/${key}`
      pictures.set(key, kind === 'svg' ? await $.fs.read(path) : (await $.fs.read(path, { as: 'bytes' })).base64)
    } catch (error) {
      $.ui.log(`koharu: cannot read ${key}: ${String(error)}`)
      return undefined
    }
  }
  return pictures.get(key)
}

const pick = (lines: string[]) => lines[Math.floor(Math.random() * lines.length)] ?? lines[0] ?? ''

// When she last saw something happen; module state, so a reload counts as activity.
let lastActivity = Date.now()
let idleTimer: { cancel: () => void } | undefined

const IDLE_ACTS: [Mood, string[]][] = [
  ['sing', ['♪ 啦啦啦～写代码真开心～', '♪ 樱花飘呀飘～', '哼～哼哼～♪']],
  ['curious', ['咦？你在想什么呀？', '那个…接下来要做什么呢？', '这个 rei 项目会变成什么样呢？']],
  ['love', ['陪在你旁边就很开心～', '今天也辛苦啦♡', '嘿嘿，偷看你一下～']],
  ['pout', ['好无聊哦…都不理小春…', '哼，再不说话小春要生气了！']],
  ['happy', ['伸个懒腰～嗯——！', '要不要喝口水休息一下？', '窗外的天气好像不错呢～']],
]

async function idleTick($: EngineInterface) {
  const now = Date.now()
  const s = await read($, state)
  if (s.isReplying) {
    return
  }
  const idle = now - lastActivity
  if (idle > 6 * 60 * 1000) {
    if (s.mood !== 'sleepy') {
      await say($, 'sleepy', pick(['呼…呼…（睡着了）', '好困…小春先眯一下…', 'zzz…抹茶…（说梦话）']))
    }
    return
  }
  if (idle > 50 * 1000 && Math.random() < 0.45) {
    const [mood, lines] = IDLE_ACTS[Math.floor(Math.random() * IDLE_ACTS.length)] ?? IDLE_ACTS[0]!
    await say($, mood, pick(lines))
  }
}

function touch() {
  lastActivity = Date.now()
}

// Her voice: a chirp per mood (assets/voice/<mood>.wav, made by make-voice.py) and, for chat replies,
// her words read by the system's own synthesizer. Both play on the machine Claude Code runs on: a Mac
// plays them; a cloud container or a Linux terminal has no speaker and plays nothing.
let voiceProblemLogged = false

function voiceFailed($: EngineInterface, error: unknown) {
  if (!voiceProblemLogged) {
    voiceProblemLogged = true
    $.ui.log(`koharu voice: ${String(error)}`, { to: 'debug' })
  }
}

async function chirp($: EngineInterface, mood: Mood) {
  const s = await read($, state)
  if (s.isMuted !== true) {
    $.audio.play({ asset: `assets/voice/${mood}.wav` }, { gain: 0.7 }).catch(error => voiceFailed($, error))
  }
}

async function speak($: EngineInterface, text: string) {
  const s = await read($, state)
  if (s.isMuted !== true) {
    $.audio.speak(text.replace(/[～~♡♪]/g, '')).catch(error => voiceFailed($, error))
  }
}

async function say($: EngineInterface, mood: Mood, line: string) {
  await update($, state, (s): Companion => ({ ...s, mood, line }))
  void chirp($, mood)
}

async function chat($: EngineInterface, text: string) {
  const message = text.trim()
  if (message === '') {
    return
  }
  touch()
  const before = await read($, state)
  if (before.isReplying) {
    return
  }
  const mine: ChatLine = { who: 'me', text: message }
  await update($, state, (s): Companion => ({
    ...s, chat: [...s.chat, mine].slice(-20), isReplying: true, mood: 'think', line: '嗯嗯…让我想想～',
  }))

  const history = [...before.chat, mine]
    .slice(-10)
    .map(one => `${one.who === 'me' ? '主人' : '小春'}：${one.text}`)
    .join('\n')
  const answer = await $.model.complete({
    model: MODEL,
    system: PERSONA,
    prompt: `${history}\n小春：`,
    maxTokens: 200,
    timeoutMs: 30000,
  })

  let mood: Mood = 'happy'
  let reply = '呜…小春刚刚走神了，可以再说一次吗？'
  if (answer.isAnswered) {
    const tag = /\[(happy|think|worry|sleepy|cheer|angry|pout|love|sing|curious)\]\s*$/.exec(answer.text.trim())
    mood = (tag?.[1] as Mood | undefined) ?? 'happy'
    reply = answer.text.trim().replace(/\[(happy|think|worry|sleepy|cheer|angry|pout|love|sing|curious)\]\s*$/, '').trim() || reply
  } else {
    mood = 'worry'
  }
  const hers: ChatLine = { who: 'koharu', text: reply }
  await update($, state, (s): Companion => ({
    ...s, chat: [...s.chat, hers].slice(-20), isReplying: false, mood, line: reply,
  }))
  void chirp($, mood)
  void speak($, reply)
}

// Called from the mod's one session.start hook.
export async function koharuStart($: EngineInterface) {
  await $.command.register({ name: 'rei-koharu', description: 'Open Koharu, your little companion' })
  await $.command.register({ name: 'koharu', description: 'Open Koharu (same as /rei-koharu)' })
  void $.ui.open({ id: KOHARU_PANE, title: TITLE })
  idleTimer?.cancel()
  idleTimer = $.clock.every(40 * 1000, () => { void idleTick($) })
  touch()
  await say($, 'happy', pick(['你好呀～我是小春！今天也一起加油吧！', '欢迎回来～要先泡杯抹茶吗？', '小春来报到啦～']))
}

// Small reactions from the mod's other hooks: canned lines, no model call.
export async function koharuOnPrompt($: EngineInterface) {
  touch()
  await say($, 'think', pick(['收到～Claude 在努力想了！', '嗯嗯，小春也在旁边看着～', '开始工作啦！']))
}

export async function koharuOnTool($: EngineInterface, tool: string) {
  touch()
  if (tool === 'Edit' || tool === 'Write') {
    await say($, Math.random() < 0.5 ? 'cheer' : 'sing', pick(['在改代码了！好厉害～', '咻咻～文件更新中！', '♪ 改代码改代码～']))
  } else if (tool === 'Bash') {
    await say($, Math.random() < 0.5 ? 'think' : 'curious', pick(['在跑命令…等一下下～', '终端在动了！', '咦，这个命令是做什么的？']))
  }
}

export async function koharuOnTurnEnd($: EngineInterface, isOk: boolean) {
  touch()
  if (isOk) {
    await say($, Math.random() < 0.5 ? 'cheer' : 'love', pick(['完成啦～辛苦了！', '搞定！要不要休息一下？', '好耶～下一步做什么呢？']))
  } else {
    await say($, Math.random() < 0.4 ? 'angry' : 'worry', pick(['唔…好像出了点问题，别灰心！', '哼，这个 bug 太坏了！再试一次吧！', '没关系～再试一次吧！']))
  }
}

function poke($: EngineInterface) {
  touch()
  const r = Math.random()
  return r < 0.35 ? say($, 'angry', pick(['呀！不要戳啦！', '哼！再戳就咬你哦！']))
    : r < 0.7 ? say($, 'worry', pick(['呜哇！吓、吓到了…', '诶诶？怎么了怎么了？']))
    : say($, 'curious', pick(['嗯？叫小春有事吗？', '怎么啦？要一起玩吗？']))
}

function pat($: EngineInterface) {
  touch()
  return Math.random() < 0.3
    ? say($, 'pout', pick(['哼…才、才没有很开心呢！', '不要一直摸啦…（尾巴在摇）']))
    : say($, Math.random() < 0.5 ? 'love' : 'cheer', pick(['嘿嘿～好舒服！', '再摸一下嘛～', '(〃ω〃) 害羞…']))
}

async function openKoharu($: EngineInterface) {
  await $.ui.open({ id: KOHARU_PANE, title: TITLE })

  return { text: '小春来啦～' }
}

export function registerKoharu(on: On) {
  on('command.run', { command: 'rei-koharu' }, openKoharu)
  on('command.run', { command: 'koharu' }, openKoharu)

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await koharuOnTurnEnd($, e.reason === 'answer')
    void toolboxBeat($, 'turn.complete')

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    void toolboxSeen($, e.surface)
    if (e.surface !== 'mobile' || e.props.hasSurvey) {
      return next(e)
    }
    const { Box, Text, Button, Svg } = $.ui.resolve(e)
    const s = await read($, state)
    const pose = POSE[s.mood]
    const [picW, picH] = SIZE[pose]
    const webp = s.form === 'fox' || !USE_SHARP ? undefined : await loadPicture($, pose, 'webp')
    const face = webp !== undefined
      ? <Svg source={picture(webp, picW, picH, s.mood)} alt={`小春 (${s.mood})`} width={72} height={Math.round((72 * (picH + PICTURE_PAD.y)) / (picW + PICTURE_PAD.x))} />
      : <Svg source={koharu(s.mood)} alt={`小狐狸小春 (${s.mood})`} width={56} height={56} />

    return (
      <Box flexDirection="row" gap={1} alignItems="center">
        {face}
        <Box flexDirection="column" flexGrow={1} gap={1}>
          <Text>{s.line}</Text>
          <Box flexDirection="row" gap={1}>
            <Button key="band-pat" label="摸摸头 ♡" onPress={() => pat($)} />
            <Button key="band-poke" label="戳一下 👉" onPress={() => poke($)} />
          </Box>
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: KOHARU_PANE }, async ($, e) => {
    const { Box, Text, Input, Button } = $.ui.resolve(e)
    const s = await read($, state)
    const isFox = s.form === 'fox'
    const pose = POSE[s.mood]
    const [picW, picH] = SIZE[pose]
    let face: JSX.Element = <Text>{KAOMOJI[s.mood]}</Text>
    if (e.surface === 'desktop' || e.surface === 'mobile' || e.surface === 'vscode') {
      const { Svg } = $.ui.resolve(e)
      const webp = isFox || !USE_SHARP ? undefined : await loadPicture($, pose, 'webp')
      const svg = isFox ? undefined : webp !== undefined ? picture(webp, picW, picH, s.mood) : await loadPicture($, pose, 'svg')
      face = svg !== undefined
        ? <Svg source={svg} alt={`小春 (${s.mood})`} width={webp !== undefined ? 200 : 160} height={webp !== undefined ? Math.round((200 * (picH + PICTURE_PAD.y)) / (picW + PICTURE_PAD.x)) : Math.round((160 * picH) / picW)} />
        : <Svg source={koharu(s.mood)} alt={`小狐狸小春 (${s.mood})`} width={110} height={110} />
    } else if (e.surface === 'terminal' && !isFox) {
      const { Image } = $.ui.resolve(e)
      const png = await loadPicture($, pose, 'png')
      if (png !== undefined) {
        face = <Image key="koharu-face" source={{ png }} columns={18} rows={12} alt={KAOMOJI[s.mood]} />
      }
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" gap={1} alignItems="center">
          {face}
          <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor="subtle" paddingX={1}>
            <Text dimColor size="caption">小春</Text>
            <Text>{s.line}</Text>
          </Box>
        </Box>

        <Box flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1}>
          {s.chat.length === 0 && <Text dimColor>在下面打字跟小春聊天吧～</Text>}
          {s.chat.slice(-8).map(one => (
            <Text dimColor={one.who === 'me'}>{one.who === 'me' ? '你' : '小春'}：{one.text}</Text>
          ))}
          {s.isReplying && <Text dimColor>小春正在输入…</Text>}
        </Box>

        <Input
          key="koharu-chat"
          placeholder="跟小春说点什么…"
          submitLabel="发送"
          value=""
          onSubmit={value => { void chat($, value) }}
        />
        <Box flexDirection="row" gap={1}>
          <Button key="poke" label="戳一下 👉" onPress={() => poke($)} />
          <Button key="pat" label="摸摸头 ♡" onPress={() => pat($)} />
          <Button
            key="form"
            label={s.form === 'fox' ? '变成人形 ✿' : '变成小狐狸 🦊'}
            onPress={() => update($, state, (x): Companion => ({
              ...x,
              form: x.form === 'fox' ? 'human' : 'fox',
              mood: x.form === 'fox' ? 'cheer' : 'happy',
              line: x.form === 'fox' ? '砰！小春变回人形了～新衣服好看吗？' : '砰！变成小狐狸啦～',
            }))}
          />
          <Button
            key="mute"
            label={s.isMuted === true ? '🔇 静音中' : '🔊 有声音'}
            onPress={async () => {
              await update($, state, (x): Companion => ({ ...x, isMuted: x.isMuted !== true }))
              const now = await read($, state)
              if (now.isMuted !== true) {
                await say($, 'happy', '嗯嗯～小春可以说话啦！')
              }
            }}
          />
          <Button key="clear" label="清空聊天" onPress={() => update($, state, (x): Companion => ({ ...x, chat: [] }))} />
        </Box>
      </Box>
    )
  })
}
