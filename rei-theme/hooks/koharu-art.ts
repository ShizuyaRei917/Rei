import type { Mood } from '../types'

// 小春 Koharu: an original little fox spirit, round as a rice cake.
const EYES_BASE = {
  happy: '<path class="ink" d="M58 82q8-9 16 0M96 82q8-9 16 0" fill="none" stroke-width="4" stroke-linecap="round"/>',
  cheer: '<path class="ink" d="M58 82q8-9 16 0M96 82q8-9 16 0" fill="none" stroke-width="4" stroke-linecap="round"/><path class="spark" d="M140 40l4 8 8 4-8 4-4 8-4-8-8-4 8-4z"/><path class="spark" d="M30 50l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/>',
  think: '<g class="blink"><circle class="ink" cx="66" cy="80" r="5"/><circle class="ink" cx="104" cy="80" r="5"/></g><g class="dots"><circle class="ink" cx="138" cy="42" r="3"/><circle class="ink" cx="148" cy="32" r="4"/><circle class="ink" cx="160" cy="20" r="5"/></g>',
  worry: '<path class="ink" d="M58 76l14 6-14 6M112 76l-14 6 14 6" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path class="drop" d="M130 60q6 10 0 14q-6-4 0-14z"/>',
  sleepy: '<path class="ink" d="M58 82h16M96 82h16" fill="none" stroke-width="4" stroke-linecap="round"/><text class="zzz" x="128" y="44" font-size="18">z</text><text class="zzz z2" x="142" y="28" font-size="14">z</text>',
}

const MOUTH_BASE = {
  happy: '<path class="ink" d="M78 96q7 7 14 0" fill="none" stroke-width="3" stroke-linecap="round"/>',
  cheer: '<path class="mouth" d="M76 94q9 14 18 0z"/>',
  think: '<path class="ink" d="M80 98h10" fill="none" stroke-width="3" stroke-linecap="round"/>',
  worry: '<path class="ink" d="M78 100q7-6 14 0" fill="none" stroke-width="3" stroke-linecap="round"/>',
  sleepy: '<circle class="mouth" cx="85" cy="98" r="4"/>',
}

const EYES: Record<Mood, string> = { ...EYES_BASE, angry: EYES_BASE.worry, pout: EYES_BASE.think, love: EYES_BASE.happy, sing: EYES_BASE.happy, curious: EYES_BASE.think }
const MOUTH: Record<Mood, string> = { ...MOUTH_BASE, angry: MOUTH_BASE.worry, pout: MOUTH_BASE.think, love: MOUTH_BASE.cheer, sing: MOUTH_BASE.cheer, curious: MOUTH_BASE.think }

export function koharu(mood: Mood): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 170" width="170" height="170">
<style>
.fur { fill: #fffaf2; stroke: #3a2f28; stroke-width: 3; }
.ear { fill: #e8805c; }
.ink { fill: #2b2420; stroke: #2b2420; }
.blush { fill: #f2a0a6; opacity: 0.7; }
.mouth { fill: #c8473a; }
.mark { fill: #c8473a; }
.bow { fill: #c8473a; stroke: #3a2f28; stroke-width: 2; }
.tail { fill: #fffaf2; stroke: #3a2f28; stroke-width: 3; }
.tailtip { fill: #e8805c; }
.spark { fill: #d9a441; }
.drop { fill: #8fb6e0; }
.zzz { fill: #7a6f66; font-family: serif; }
.body { animation: bob 3.2s ease-in-out infinite; transform-origin: 85px 150px; }
.tailg { animation: wag 2.4s ease-in-out infinite; transform-origin: 120px 140px; }
.blink { animation: blink 4.5s infinite; transform-origin: 85px 80px; }
.dots { animation: fade 1.6s ease-in-out infinite; }
.zzz { animation: fade 2.4s ease-in-out infinite; }
.z2 { animation-delay: 0.8s; }
@keyframes bob { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
@keyframes wag { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(8deg); } }
@keyframes blink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(0.1); } }
@keyframes fade { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
</style>
<g class="tailg"><path class="tail" d="M118 140q40-6 38-46q-2-14-12-18q4 30-30 50z"/><path class="tailtip" d="M146 78q10 6 10 16q-6-4-14-4q2-6 4-12z"/></g>
<g class="body">
<path class="fur" d="M40 64l-6-38 30 22zM130 64l6-38-30 22z"/>
<path class="ear" d="M42 56l-3-22 16 13zM128 56l3-22-16 13z"/>
<ellipse class="fur" cx="85" cy="100" rx="56" ry="50"/>
<path class="mark" d="M80 52q5-8 10 0q-5 6-10 0z"/>
<ellipse class="blush" cx="54" cy="96" rx="9" ry="5"/>
<ellipse class="blush" cx="116" cy="96" rx="9" ry="5"/>
${EYES[mood]}
${MOUTH[mood]}
<path class="bow" d="M85 140l-16-9v18zM85 140l16-9v18z"/><circle class="bow" cx="85" cy="140" r="4"/>
</g>
</svg>`
}

// 新造型 Koharu: the person's own drawing, one picture per expression.
export type Pose = 'angry' | 'pout' | 'fluster' | 'happy' | 'sleepy'

export const POSE: Record<Mood, Pose> = {
  happy: 'happy', cheer: 'happy', think: 'pout', worry: 'fluster', sleepy: 'sleepy', angry: 'angry', pout: 'pout',
  love: 'happy', sing: 'happy', curious: 'pout',
}


// Wraps a sharp picture of the drawing in an SVG for the desktop and mobile panes. Each mood moves the
// picture its own way and floats its own little effects around her head. Motion stays slow and soft:
// nothing changes colour or flashes, it only drifts, hops and fades.
// (Never name a variable `h` in a .tsx file: JSX compiles against the global `h`.)

const PAD_X = 50
const PAD_TOP = 40

// Small vector effects, drawn at the origin and placed by a wrapper.
const HEART = '<path fill="#f48fb1" stroke="#c2577a" stroke-width="1.2" d="M0 4c0-5 7-7 9-2c2-5 9-3 9 2c0 6-9 11-9 11S0 10 0 4z"/>'
const STAR = '<path fill="#f2c14e" d="M0-10l2.6 7.4 7.4 2.6-7.4 2.6L0 10l-2.6-7.4L-10 0l7.4-2.6z"/>'
const ANGER = '<path fill="none" stroke="#e5484d" stroke-width="3.6" stroke-linecap="round" d="M-9-2q7 0 7-7M9-2q-7 0-7-7M-9 2q7 0 7 7M9 2q-7 0-7 7"/>'
const DROP = '<path fill="#9cc9f2" stroke="#5f9bd1" stroke-width="1" d="M0 0q7 10 0 15q-7-5 0-15z"/>'
const NOTE = '<path fill="#8b6cc7" d="M6-14v14.5a4.5 3.6-20 1 1-2-3V-10l12-3v11.5a4.5 3.6-20 1 1-2-3V-9.8z"/>'
const Q = '<text fill="#8b6cc7" font-family="sans-serif" font-weight="bold" font-size="30" text-anchor="middle">?</text>'
const Z = (size: number) => `<text fill="#7b6fa8" font-family="sans-serif" font-weight="bold" font-size="${size}">Z</text>`
const DOT = '<circle fill="#9d93b8" r="4"/>'
const PUFF = '<g fill="#ffffff" stroke="#b9b2c9" stroke-width="1.2"><circle r="7"/><circle cx="8" cy="-3" r="6"/><circle cx="14" cy="3" r="5"/></g>'

const at = (x: number, y: number, cls: string, art: string, delay = 0) =>
  `<g transform="translate(${x} ${y}) scale(1.9)"><g class="${cls}" style="animation-delay:${delay}s">${art}</g></g>`

function effects(mood: Mood, picW: number): string {
  const r = PAD_X + picW * 0.86
  const l = PAD_X + picW * 0.1
  switch (mood) {
    case 'love':
      return at(r, 120, 'rise', HEART) + at(r - 30, 140, 'rise', HEART, 1.2) + at(l + 10, 130, 'rise', HEART, 2.1)
    case 'happy':
      return at(r, 110, 'rise', HEART, 0.4) + at(l, 140, 'twinkle', STAR, 1)
    case 'cheer':
      return at(r, 90, 'twinkle', STAR) + at(l, 120, 'twinkle', STAR, 0.7) + at(r - 20, 40, 'twinkle', STAR, 1.3) + at(l + 30, 50, 'twinkle', STAR, 0.4)
    case 'sing':
      return at(r, 120, 'drift', NOTE) + at(r - 25, 140, 'drift', NOTE, 1.1) + at(l, 130, 'driftL', NOTE, 0.6) + at(l + 20, 150, 'driftL', NOTE, 1.8)
    case 'angry':
      return at(r - 10, 70, 'pulse', ANGER) + at(l - 5, 140, 'puff', PUFF, 0.5)
    case 'pout':
      return at(l - 5, 150, 'puff', PUFF) + at(r, 80, 'pulse', ANGER, 0.8)
    case 'think':
      return at(r - 10, 70, 'dot', DOT) + at(r + 4, 52, 'dot', DOT, 0.35) + at(r + 18, 34, 'dot', DOT, 0.7)
    case 'curious':
      return at(r, 70, 'pop', Q) + at(r + 18, 40, 'pop', Q, 1.4)
    case 'worry':
      return at(r - 30, 120, 'slide', DROP) + at(l + 30, 115, 'slide', DROP, 1.1)
    case 'sleepy':
      return at(r - 20, 90, 'zrise', Z(18)) + at(r - 5, 70, 'zrise', Z(24), 1.2) + at(r + 10, 50, 'zrise', Z(30), 2.4)
  }
}

const MOTION: Record<Mood, string> = {
  happy: 'hop 2.6s ease-in-out infinite',
  love: 'hop 2.2s ease-in-out infinite',
  cheer: 'jump 1.5s ease-in-out infinite',
  sing: 'dance 2s ease-in-out infinite',
  angry: 'stomp 1.8s ease-in-out infinite',
  pout: 'sway 3.2s ease-in-out infinite',
  think: 'sway 4s ease-in-out infinite',
  curious: 'tilt 3.6s ease-in-out infinite',
  worry: 'tremble 2.4s linear infinite',
  sleepy: 'doze 4.8s ease-in-out infinite',
}

export function picture(webpBase64: string, picW: number, picH: number, mood: Mood): string {
  const boxW = picW + PAD_X * 2
  const boxH = picH + PAD_TOP + 8
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${boxW} ${boxH}" width="${boxW}" height="${boxH}">
<style>
.pic { animation: ${MOTION[mood]}; transform-box: fill-box; transform-origin: 50% 100%; }
.rise, .drift, .driftL, .zrise, .pop, .slide, .dot, .twinkle, .pulse, .puff { transform-box: fill-box; transform-origin: center; opacity: 0; }
.rise { animation: rise 3.2s ease-out infinite; }
.drift { animation: drift 3s ease-out infinite; }
.driftL { animation: driftL 3s ease-out infinite; }
.zrise { animation: zrise 3.6s ease-out infinite; }
.pop { animation: pop 2.8s ease-in-out infinite; }
.slide { animation: slide 2.2s ease-in infinite; }
.dot { animation: dot 1.8s ease-in-out infinite; }
.twinkle { animation: twinkle 1.8s ease-in-out infinite; }
.pulse { animation: pulse 1.4s ease-in-out infinite; }
.puff { animation: puffout 2.6s ease-out infinite; }
@keyframes hop { 0%, 55%, 100% { transform: translateY(0px) scale(1, 1); } 65% { transform: translateY(0px) scale(1.02, 0.97); } 75% { transform: translateY(-14px) scale(0.99, 1.02); } 88% { transform: translateY(0px) scale(1.01, 0.98); } }
@keyframes jump { 0%, 100% { transform: translateY(0px) scale(1, 1); } 20% { transform: translateY(0px) scale(1.03, 0.95); } 45% { transform: translateY(-24px) scale(0.98, 1.03); } 70% { transform: translateY(0px) scale(1.02, 0.97); } }
@keyframes dance { 0%, 100% { transform: translateX(0px) rotate(0deg); } 25% { transform: translateX(-6px) rotate(-3deg); } 50% { transform: translateX(0px) translateY(-5px) rotate(0deg); } 75% { transform: translateX(6px) rotate(3deg); } }
@keyframes stomp { 0%, 40%, 100% { transform: translateX(0px) rotate(0deg); } 48% { transform: translateX(-4px) rotate(-1.5deg); } 56% { transform: translateX(4px) rotate(1.5deg); } 64% { transform: translateX(-3px) rotate(-1deg); } 72% { transform: translateX(2px) rotate(0.5deg); } }
@keyframes sway { 0%, 100% { transform: rotate(-1.8deg); } 50% { transform: rotate(1.8deg); } }
@keyframes tilt { 0%, 100% { transform: rotate(0deg); } 30%, 70% { transform: rotate(5deg); } }
@keyframes tremble { 0%, 60%, 100% { transform: translateX(0px); } 64% { transform: translateX(-1.5px); } 68% { transform: translateX(1.5px); } 72% { transform: translateX(-1.5px); } 76% { transform: translateX(1.5px); } 80% { transform: translateX(0px); } }
@keyframes doze { 0%, 100% { transform: rotate(0deg) scale(1, 1); } 50% { transform: rotate(-2.5deg) scale(1.01, 1.015); } }
@keyframes rise { 0% { opacity: 0; transform: translateY(0px) scale(0.6); } 20% { opacity: 1; transform: translateY(-10px) scale(1); } 100% { opacity: 0; transform: translateY(-60px) scale(1.1); } }
@keyframes drift { 0% { opacity: 0; transform: translate(0px, 0px) rotate(-10deg); } 25% { opacity: 1; } 100% { opacity: 0; transform: translate(26px, -56px) rotate(15deg); } }
@keyframes driftL { 0% { opacity: 0; transform: translate(0px, 0px) rotate(10deg); } 25% { opacity: 1; } 100% { opacity: 0; transform: translate(-26px, -56px) rotate(-15deg); } }
@keyframes zrise { 0% { opacity: 0; transform: translate(0px, 0px); } 25% { opacity: 1; } 100% { opacity: 0; transform: translate(18px, -50px); } }
@keyframes pop { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(-10deg); } 20%, 70% { opacity: 1; transform: scale(1) rotate(8deg); } }
@keyframes slide { 0% { opacity: 0; transform: translateY(0px); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(26px); } }
@keyframes dot { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
@keyframes twinkle { 0%, 100% { opacity: 0.15; transform: scale(0.6) rotate(0deg); } 50% { opacity: 1; transform: scale(1.1) rotate(20deg); } }
@keyframes pulse { 0%, 100% { opacity: 0.85; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.15); } }
@keyframes puffout { 0% { opacity: 0; transform: translateX(0px) scale(0.5); } 25% { opacity: 1; } 100% { opacity: 0; transform: translateX(-24px) scale(1.2); } }
</style>
<g class="pic"><image x="${PAD_X}" y="${PAD_TOP}" width="${picW}" height="${picH}" href="data:image/webp;base64,${webpBase64}"/></g>
${effects(mood, picW)}
</svg>`
}

export const PICTURE_PAD = { x: PAD_X * 2, y: PAD_TOP + 8 }
