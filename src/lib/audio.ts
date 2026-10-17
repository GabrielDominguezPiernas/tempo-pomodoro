let audioContext: AudioContext | null = null;
let isUnlocked = false;

export function unlockAudio(): void {
  if (isUnlocked) return;

  try {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Crear un sonido silencioso para desbloquear en iOS/Safari
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(0);
    oscillator.stop(0.001);

    isUnlocked = true;
  } catch {
    console.warn('Web Audio API no disponible');
  }
}

export function getAudioContext(): AudioContext | null {
  if (!audioContext) {
    unlockAudio();
  }
  return audioContext;
}

/**
 * Sonido suave: tres tonos ascendentes (C5, E5, G5)
 */
function playGentleSound(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const frequencies = [523.25, 659.25, 783.99];
  const duration = 0.15;
  const gap = 0.1;

  frequencies.forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = freq;

    gainNode.gain.setValueAtTime(0, now + i * (duration + gap));
    gainNode.gain.linearRampToValueAtTime(0.15, now + i * (duration + gap) + 0.02);
    gainNode.gain.setValueAtTime(0.15, now + i * (duration + gap) + duration - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + i * (duration + gap) + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now + i * (duration + gap));
    oscillator.stop(now + i * (duration + gap) + duration);
  });
}

/**
 * Sonido gota: un único tono corto con caída rápida
 */
function playDropSound(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.15);

  gainNode.gain.setValueAtTime(0.15, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.15);
}

/**
 * Sonido madera: tono triangular corto, dos golpes
 */
function playWoodSound(ctx: AudioContext): void {
  const now = ctx.currentTime;

  for (let i = 0; i < 2; i++) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 800;

    const start = now + i * 0.12;
    gainNode.gain.setValueAtTime(0.12, start);
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.08);
  }
}

/**
 * Sonido campana: sinusoide con armónicos y decaimiento largo
 */
function playBellSound(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const fundamentals = [523.25, 659.25];
  const duration = 0.8;

  fundamentals.forEach((freq, idx) => {
    // Fundamental
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    gain1.gain.setValueAtTime(0.1, now + idx * 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + duration);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now + idx * 0.1);
    osc1.stop(now + idx * 0.1 + duration);

    // Armónico
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2.4;
    gain2.gain.setValueAtTime(0.05, now + idx * 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + duration * 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + idx * 0.1);
    osc2.stop(now + idx * 0.1 + duration * 0.5);
  });
}

export type SoundId = 'gentle' | 'drop' | 'wood' | 'bell';

export function playNotificationSound(soundId: SoundId = 'gentle'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  switch (soundId) {
    case 'drop':
      playDropSound(ctx);
      break;
    case 'wood':
      playWoodSound(ctx);
      break;
    case 'bell':
      playBellSound(ctx);
      break;
    case 'gentle':
    default:
      playGentleSound(ctx);
      break;
  }
}
