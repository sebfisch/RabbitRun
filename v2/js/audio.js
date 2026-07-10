// Kleine WebAudio-Soundeffekte – wie die Grafik komplett im Code erzeugt,
// ohne externe Dateien. Vor der ersten Nutzergeste sind alle Aufrufe No-ops.

let ac = null;
let muted = false;

export function initAudio() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ac = new AC();
  }
  if (ac && ac.state === 'suspended') {
    ac.resume().catch(() => {});
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(f0, f1, dur, type = 'square', vol = 0.1, delay = 0) {
  if (!ac || muted) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, f0), t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const SFX = {
  jump() { tone(300, 540, 0.12); },
  airJump() {
    tone(430, 760, 0.1);
    tone(650, 900, 0.08, 'square', 0.06, 0.05);
  },
  dive() { tone(600, 160, 0.16, 'sawtooth', 0.08); },
  slam() { tone(160, 60, 0.12, 'square', 0.12); },
  // Tonhöhe steigt mit der Combo
  collect(combo = 1) { tone(620 + combo * 90, 900 + combo * 120, 0.09, 'square', 0.09); },
  gold() {
    [660, 830, 990, 1320].forEach((f, i) => tone(f, f, 0.09, 'square', 0.09, i * 0.07));
  },
  stomp() {
    tone(240, 80, 0.12, 'square', 0.12);
    tone(500, 900, 0.08, 'square', 0.05, 0.03);
  },
  gameover() { tone(320, 70, 0.55, 'sawtooth', 0.1); },
  record() {
    [520, 660, 780, 1040].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.1, 0.1 + i * 0.09));
  },
};
