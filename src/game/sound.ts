import type { SoundName } from "./types";

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  when = 0,
  slideTo?: number
) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function play(name: SoundName) {
  if (muted) return;
  try {
    switch (name) {
      case "hit":
        tone(190, 0.09, "square", 0.05, 0, 90);
        break;
      case "crit":
        tone(520, 0.08, "square", 0.06, 0, 200);
        tone(160, 0.16, "sawtooth", 0.05, 0.03, 60);
        break;
      case "dodge":
        tone(700, 0.1, "sine", 0.04, 0, 1200);
        break;
      case "potion":
        tone(420, 0.1, "sine", 0.05);
        tone(640, 0.12, "sine", 0.05, 0.09);
        break;
      case "spell":
        tone(300, 0.2, "sawtooth", 0.05, 0, 760);
        tone(900, 0.14, "triangle", 0.04, 0.1, 1400);
        break;
      case "heal":
        tone(440, 0.14, "sine", 0.05);
        tone(554, 0.14, "sine", 0.05, 0.1);
        tone(659, 0.2, "sine", 0.05, 0.2);
        break;
      case "coin":
        tone(980, 0.07, "square", 0.035);
        tone(1320, 0.1, "square", 0.03, 0.07);
        break;
      case "buy":
        tone(760, 0.08, "triangle", 0.05);
        tone(1140, 0.12, "triangle", 0.04, 0.08);
        break;
      case "level":
        [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, "triangle", 0.055, i * 0.1));
        break;
      case "death":
        tone(320, 0.5, "sawtooth", 0.06, 0, 60);
        tone(160, 0.7, "sine", 0.05, 0.15, 40);
        break;
      case "elite":
        tone(140, 0.3, "sawtooth", 0.06);
        tone(280, 0.3, "square", 0.045, 0.12, 120);
        break;
      case "click":
        tone(600, 0.045, "triangle", 0.03);
        break;
    }
  } catch {
    /* audio unavailable */
  }
}
