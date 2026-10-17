/**
 * Recompensas desbloqueables: colores, fondos y sonidos
 */

export interface AccentColor {
  id: string;
  name: string;
  value: string;
  light: string;
  requiredBadge: string | null; // null = gratis
}

export interface BackgroundColor {
  id: string;
  name: string;
  value: string;
  requiredBadge: string | null;
}

export interface NotificationSound {
  id: string;
  name: string;
  requiredBadge: string | null;
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: 'terracotta',
    name: 'Terracota',
    value: '#C4785A',
    light: 'rgba(196, 120, 90, 0.12)',
    requiredBadge: null,
  },
  {
    id: 'slate',
    name: 'Azul pizarra',
    value: '#5B7C99',
    light: 'rgba(91, 124, 153, 0.12)',
    requiredBadge: 'first',
  },
  {
    id: 'graphite',
    name: 'Grafito',
    value: '#4A4A4F',
    light: 'rgba(74, 74, 79, 0.12)',
    requiredBadge: 'streak3',
  },
  {
    id: 'ochre',
    name: 'Ocre',
    value: '#B8935A',
    light: 'rgba(184, 147, 90, 0.12)',
    requiredBadge: 'cycle',
  },
  {
    id: 'burgundy',
    name: 'Burdeos',
    value: '#8C4A52',
    light: 'rgba(140, 74, 82, 0.12)',
    requiredBadge: 'streak7',
  },
];

export const BACKGROUND_COLORS: BackgroundColor[] = [
  {
    id: 'cream',
    name: 'Crema',
    value: '#F5F0E6',
    requiredBadge: null,
  },
  {
    id: 'bone',
    name: 'Hueso',
    value: '#F2F2EF',
    requiredBadge: 'hours10',
  },
  {
    id: 'sand',
    name: 'Arena',
    value: '#EFE8DC',
    requiredBadge: 'early',
  },
  {
    id: 'pearl',
    name: 'Gris perla',
    value: '#ECEDEF',
    requiredBadge: 'night',
  },
  {
    id: 'mist',
    name: 'Niebla azulada',
    value: '#E9EEF1',
    requiredBadge: 'hours50',
  },
];

export const NOTIFICATION_SOUNDS: NotificationSound[] = [
  {
    id: 'gentle',
    name: 'Suave',
    requiredBadge: null,
  },
  {
    id: 'drop',
    name: 'Gota',
    requiredBadge: 'first',
  },
  {
    id: 'wood',
    name: 'Madera',
    requiredBadge: 'cycle',
  },
  {
    id: 'bell',
    name: 'Campana',
    requiredBadge: 'streak7',
  },
];

export interface ThemeSettings {
  accentId: string;
  backgroundId: string;
  soundId: string;
}

const STORAGE_KEY = 'pomodoro-theme-v1';

const DEFAULT_THEME: ThemeSettings = {
  accentId: 'terracotta',
  backgroundId: 'cream',
  soundId: 'gentle',
};

export function loadTheme(): ThemeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw);
    return {
      accentId: parsed.accentId || DEFAULT_THEME.accentId,
      backgroundId: parsed.backgroundId || DEFAULT_THEME.backgroundId,
      soundId: parsed.soundId || DEFAULT_THEME.soundId,
    };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme: ThemeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Ignorar errores
  }
}

/**
 * Aplica el tema al documento
 */
export function applyTheme(theme: ThemeSettings): void {
  const accent = ACCENT_COLORS.find((c) => c.id === theme.accentId) || ACCENT_COLORS[0];
  const bg = BACKGROUND_COLORS.find((c) => c.id === theme.backgroundId) || BACKGROUND_COLORS[0];

  const root = document.documentElement;
  root.style.setProperty('--color-accent-study', accent.value);
  root.style.setProperty('--color-accent-study-light', accent.light);
  root.style.setProperty('--color-bg', bg.value);

  // Actualizar theme-color meta
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', bg.value);
  }
}

/**
 * Verifica si una recompensa está disponible
 */
export function isRewardUnlocked(
  requiredBadge: string | null,
  unlockedBadges: Record<string, string>
): boolean {
  if (requiredBadge === null) return true;
  return !!unlockedBadges[requiredBadge];
}

/**
 * Obtiene el nombre de la insignia requerida
 */
export function getRequiredBadgeName(badgeId: string): string {
  // Importación dinámica para evitar ciclos
  // Los IDs originales se mantienen con los mismos nombres
  const names: Record<string, string> = {
    first: 'Primer pomodoro',
    cycle: 'Ciclo completo',
    streak3: 'Constancia',
    streak7: 'Una semana',
    streak30: 'Un mes',
    hours10: '10 horas',
    hours50: '50 horas',
    hours100: '100 horas',
    early: 'Madrugador',
    night: 'Noctámbulo',
    marathon: 'Maratón',
    // Nuevas insignias que podrían usarse como requisitos
    pom10: 'Diez pomodoros',
    pom50: 'Cincuenta',
    pom100: 'Cien pomodoros',
    streak14: 'Dos semanas',
    goalstreak7: 'Objetivo 7',
  };
  return names[badgeId] || badgeId;
}
