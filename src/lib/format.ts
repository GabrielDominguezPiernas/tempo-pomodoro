export function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatTimeForTitle(ms: number, phase: 'study' | 'break'): string {
  const time = formatTime(ms);
  const phaseLabel = phase === 'study' ? 'Estudio' : 'Descanso';
  return `${time} · ${phaseLabel}`;
}
