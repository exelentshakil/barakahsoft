// High-fidelity, soothing Shopify-like order / new lead chime.
// Synthesizes a warm, crisp, dopamine-rich cash/chime notification sound
// using Web Audio API with zero external audio assets.

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// Ensure AudioContext is unlocked on the first user gesture
if (typeof window !== "undefined") {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("click", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true, passive: true });
  window.addEventListener("click", unlock, { once: true, passive: true });
}

/**
 * Plays a soothing, crisp Shopify-style "cha-ching" notification chime.
 */
export function playShopifyLeadChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().then(() => playChimeNodes(ctx)).catch(() => {});
      return;
    }

    playChimeNodes(ctx);
  } catch (err) {
    console.error("[sound] Failed to play lead chime", err);
  }
}

function playChimeNodes(ctx: AudioContext) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.7, now);
  masterGain.connect(ctx.destination);

  // 1. Initial metallic "cha" clink transient
  playTone(ctx, masterGain, {
    freq: 2800,
    type: "sine",
    start: now,
    duration: 0.05,
    gain: 0.25,
  });
  playTone(ctx, masterGain, {
    freq: 3900,
    type: "triangle",
    start: now + 0.01,
    duration: 0.06,
    gain: 0.2,
  });

  // 2. First melodic bell chime (E6 ~1318 Hz)
  playBell(ctx, masterGain, {
    freq: 1318.5,
    start: now + 0.035,
    duration: 0.45,
    gain: 0.35,
  });

  // 3. Second melodic high bell chime (G#6 ~1661 Hz & E7 ~2637 Hz - bright & uplifting)
  playBell(ctx, masterGain, {
    freq: 1661.2,
    start: now + 0.11,
    duration: 0.85,
    gain: 0.4,
  });
  playBell(ctx, masterGain, {
    freq: 2637.0,
    start: now + 0.115,
    duration: 1.1,
    gain: 0.28,
  });

  // 4. Warm subtle shimmer harmonic
  playTone(ctx, masterGain, {
    freq: 5274.0,
    type: "sine",
    start: now + 0.12,
    duration: 0.7,
    gain: 0.08,
  });
}

function playTone(
  ctx: AudioContext,
  destination: AudioNode,
  {
    freq,
    type = "sine",
    start,
    duration,
    gain,
  }: {
    freq: number;
    type?: OscillatorType;
    start: number;
    duration: number;
    gain: number;
  }
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gainNode.gain.setValueAtTime(0.001, start);
  gainNode.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gainNode);
  gainNode.connect(destination);

  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function playBell(
  ctx: AudioContext,
  destination: AudioNode,
  {
    freq,
    start,
    duration,
    gain,
  }: {
    freq: number;
    start: number;
    duration: number;
    gain: number;
  }
) {
  // Fundamental tone (sine)
  const osc1 = ctx.createOscillator();
  const gainNode1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(freq, start);

  gainNode1.gain.setValueAtTime(0.001, start);
  gainNode1.gain.exponentialRampToValueAtTime(gain, start + 0.006);
  gainNode1.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc1.connect(gainNode1);
  gainNode1.connect(destination);

  osc1.start(start);
  osc1.stop(start + duration + 0.05);

  // Soft overtone (triangle)
  const osc2 = ctx.createOscillator();
  const gainNode2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(freq * 2.01, start);

  gainNode2.gain.setValueAtTime(0.001, start);
  gainNode2.gain.exponentialRampToValueAtTime(gain * 0.3, start + 0.006);
  gainNode2.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.6);

  osc2.connect(gainNode2);
  gainNode2.connect(destination);

  osc2.start(start);
  osc2.stop(start + duration * 0.6 + 0.05);
}
