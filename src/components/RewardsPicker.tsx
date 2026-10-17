import { useCallback } from 'react';
import {
  ACCENT_COLORS,
  BACKGROUND_COLORS,
  NOTIFICATION_SOUNDS,
  isRewardUnlocked,
  getRequiredBadgeName,
  ThemeSettings,
} from '../lib/rewards';
import { UnlockedMap } from '../lib/achievements';
import { playNotificationSound, SoundId } from '../lib/audio';

interface RewardsPickerProps {
  theme: ThemeSettings;
  unlocked: UnlockedMap;
  onAccentChange: (id: string) => void;
  onBackgroundChange: (id: string) => void;
  onSoundChange: (id: string) => void;
}

export function RewardsPicker({
  theme,
  unlocked,
  onAccentChange,
  onBackgroundChange,
  onSoundChange,
}: RewardsPickerProps) {
  const handleTestSound = useCallback((soundId: string) => {
    playNotificationSound(soundId as SoundId);
  }, []);

  return (
    <div className="rewards-picker">
      {/* Colores de acento */}
      <section className="rewards-section">
        <h3 className="rewards-title">Color de acento</h3>
        <div className="color-options">
          {ACCENT_COLORS.map((color) => {
            const available = isRewardUnlocked(color.requiredBadge, unlocked);
            const selected = theme.accentId === color.id;

            return (
              <button
                key={color.id}
                type="button"
                className={`color-option${selected ? ' color-option--selected' : ''}${!available ? ' color-option--locked' : ''}`}
                style={{ '--option-color': color.value } as React.CSSProperties}
                onClick={() => available && onAccentChange(color.id)}
                disabled={!available}
                aria-label={`${color.name}${!available ? ' (bloqueado)' : ''}${selected ? ' (seleccionado)' : ''}`}
                title={available ? color.name : `Se desbloquea con: ${getRequiredBadgeName(color.requiredBadge!)}`}
              >
                {!available && <span className="lock-icon">🔒</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* Fondos */}
      <section className="rewards-section">
        <h3 className="rewards-title">Fondo</h3>
        <div className="background-options">
          {BACKGROUND_COLORS.map((bg) => {
            const available = isRewardUnlocked(bg.requiredBadge, unlocked);
            const selected = theme.backgroundId === bg.id;

            return (
              <button
                key={bg.id}
                type="button"
                className={`background-option${selected ? ' background-option--selected' : ''}${!available ? ' background-option--locked' : ''}`}
                onClick={() => available && onBackgroundChange(bg.id)}
                disabled={!available}
                aria-label={`${bg.name}${!available ? ' (bloqueado)' : ''}${selected ? ' (seleccionado)' : ''}`}
              >
                <span
                  className="background-swatch"
                  style={{ backgroundColor: bg.value }}
                />
                <span className="background-name">
                  {bg.name}
                  {!available && <span className="lock-icon">🔒</span>}
                </span>
                {!available && (
                  <span className="background-hint">
                    {getRequiredBadgeName(bg.requiredBadge!)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Sonidos */}
      <section className="rewards-section">
        <h3 className="rewards-title">Sonido de aviso</h3>
        <div className="sound-options">
          {NOTIFICATION_SOUNDS.map((sound) => {
            const available = isRewardUnlocked(sound.requiredBadge, unlocked);
            const selected = theme.soundId === sound.id;

            return (
              <div
                key={sound.id}
                className={`sound-option${selected ? ' sound-option--selected' : ''}${!available ? ' sound-option--locked' : ''}`}
              >
                <label className="sound-label">
                  <input
                    type="radio"
                    name="notification-sound"
                    checked={selected}
                    onChange={() => available && onSoundChange(sound.id)}
                    disabled={!available}
                    className="sound-radio"
                  />
                  <span className="sound-name">
                    {sound.name}
                    {!available && <span className="lock-icon">🔒</span>}
                  </span>
                </label>
                {available && (
                  <button
                    type="button"
                    className="sound-test"
                    onClick={() => handleTestSound(sound.id)}
                    aria-label={`Probar sonido ${sound.name}`}
                  >
                    Probar
                  </button>
                )}
                {!available && (
                  <span className="sound-hint">
                    {getRequiredBadgeName(sound.requiredBadge!)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
