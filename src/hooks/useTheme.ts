import { useState, useEffect, useCallback } from 'react';
import {
  ThemeSettings,
  loadTheme,
  saveTheme,
  applyTheme,
  ACCENT_COLORS,
  BACKGROUND_COLORS,
  NOTIFICATION_SOUNDS,
  isRewardUnlocked,
} from '../lib/rewards';
import { UnlockedMap } from '../lib/achievements';

interface UseThemeReturn {
  theme: ThemeSettings;
  setAccent: (id: string) => void;
  setBackground: (id: string) => void;
  setSound: (id: string) => void;
}

export function useTheme(unlocked: UnlockedMap): UseThemeReturn {
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    const saved = loadTheme();
    // Validar que las opciones guardadas siguen disponibles
    const accent = ACCENT_COLORS.find((c) => c.id === saved.accentId);
    const bg = BACKGROUND_COLORS.find((c) => c.id === saved.backgroundId);
    const sound = NOTIFICATION_SOUNDS.find((s) => s.id === saved.soundId);

    return {
      accentId: accent && isRewardUnlocked(accent.requiredBadge, unlocked)
        ? saved.accentId
        : 'terracotta',
      backgroundId: bg && isRewardUnlocked(bg.requiredBadge, unlocked)
        ? saved.backgroundId
        : 'cream',
      soundId: sound && isRewardUnlocked(sound.requiredBadge, unlocked)
        ? saved.soundId
        : 'gentle',
    };
  });

  // Aplicar tema al cargar
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setAccent = useCallback((id: string) => {
    setTheme((prev) => {
      const newTheme = { ...prev, accentId: id };
      saveTheme(newTheme);
      applyTheme(newTheme);
      return newTheme;
    });
  }, []);

  const setBackground = useCallback((id: string) => {
    setTheme((prev) => {
      const newTheme = { ...prev, backgroundId: id };
      saveTheme(newTheme);
      applyTheme(newTheme);
      return newTheme;
    });
  }, []);

  const setSound = useCallback((id: string) => {
    setTheme((prev) => {
      const newTheme = { ...prev, soundId: id };
      saveTheme(newTheme);
      return newTheme;
    });
  }, []);

  return { theme, setAccent, setBackground, setSound };
}
