# Synthesizes 小春's little voice: one short chirp per mood, as 16-bit mono WAV.
# Run: python3 make-voice.py <out dir>
import sys, wave
import numpy as np

RATE = 22050
rng = np.random.default_rng(7)


def env(n, attack=0.01, release=0.08):
    t = np.arange(n) / RATE
    a = np.clip(t / attack, 0, 1)
    r = np.clip((n / RATE - t) / release, 0, 1)
    return a * r


def chirp(f0, f1, dur, vib=0.0, vib_hz=6.0, bright=0.25, attack=0.01, release=0.08, curve=1.0):
    n = int(dur * RATE)
    x = np.linspace(0, 1, n) ** curve
    f = f0 + (f1 - f0) * x
    f = f * (1 + vib * np.sin(2 * np.pi * vib_hz * np.arange(n) / RATE))
    phase = 2 * np.pi * np.cumsum(f) / RATE
    # A soft, voice-like tone: fundamental plus a little 2nd and 3rd harmonic.
    tone = np.sin(phase) + bright * np.sin(2 * phase) + bright * 0.4 * np.sin(3 * phase)
    return tone * env(n, attack, release)


def breath(dur, gain=0.15):
    n = int(dur * RATE)
    noise = rng.standard_normal(n)
    noise = np.convolve(noise, np.ones(12) / 12, mode='same')
    return noise * env(n, 0.05, dur * 0.6) * gain


def rest(dur):
    return np.zeros(int(dur * RATE))


def cat(*parts):
    return np.concatenate(parts)


VOICES = {
    'happy':   cat(chirp(820, 1250, 0.11), rest(0.05), chirp(900, 1400, 0.13)),
    'love':    cat(chirp(700, 1050, 0.22, vib=0.03, curve=0.6), chirp(1050, 800, 0.32, vib=0.04, release=0.2)),
    'cheer':   cat(chirp(900, 1300, 0.08), rest(0.03), chirp(1000, 1450, 0.08), rest(0.03), chirp(1100, 1650, 0.14)),
    'sing':    cat(*[cat(chirp(f, f * 1.01, 0.13, vib=0.015, release=0.05), rest(0.02)) for f in [784, 880, 988, 880, 1175]]),
    'angry':   cat(chirp(420, 360, 0.09, bright=0.7), rest(0.05), chirp(440, 340, 0.12, bright=0.7)),
    'pout':    cat(breath(0.12, 0.3), chirp(380, 330, 0.22, bright=0.5, release=0.12)),
    'think':   chirp(300, 360, 0.45, vib=0.01, bright=0.15, attack=0.05, release=0.15),
    'curious': chirp(520, 900, 0.26, bright=0.2, curve=2.0, release=0.06),
    'worry':   chirp(950, 620, 0.42, vib=0.04, vib_hz=9, release=0.15),
    'sleepy':  cat(chirp(620, 360, 0.6, vib=0.01, bright=0.1, attack=0.08, release=0.3), breath(0.4, 0.08)),
}

out = sys.argv[1]
for name, x in VOICES.items():
    x = x / np.max(np.abs(x)) * 0.5
    pcm = (x * 32767).astype('<i2')
    with wave.open(f'{out}/{name}.wav', 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())
    print(name, f'{len(x) / RATE:.2f}s')
