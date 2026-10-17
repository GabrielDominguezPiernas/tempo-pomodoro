import { ACHIEVEMENTS, UnlockedMap, TIER_COLORS } from '../lib/achievements';

interface BadgeGridProps {
  unlocked: UnlockedMap;
}

function formatUnlockDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function BadgeGrid({ unlocked }: BadgeGridProps) {
  const unlockedCount = Object.keys(unlocked).filter((id) =>
    ACHIEVEMENTS.some((a) => a.id === id)
  ).length;

  return (
    <div className="badge-grid-container">
      <p className="badge-grid-header">
        {unlockedCount} de {ACHIEVEMENTS.length} conseguidas
      </p>
      <div className="badge-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = !!unlocked[achievement.id];
          const unlockDate = unlocked[achievement.id];
          const tierColor = TIER_COLORS[achievement.tier];

          return (
            <div
              key={achievement.id}
              className={`badge-card${isUnlocked ? '' : ' badge-card--locked'}`}
              style={
                isUnlocked
                  ? ({ '--badge-tier-color': tierColor } as React.CSSProperties)
                  : undefined
              }
            >
              <div
                className="badge-emoji-wrapper"
                style={
                  isUnlocked
                    ? { borderColor: tierColor }
                    : undefined
                }
              >
                <span className="badge-emoji" aria-hidden="true">
                  {achievement.emoji}
                </span>
              </div>
              <div className="badge-info">
                <span className="badge-name">{achievement.name}</span>
                <span className="badge-desc">
                  {isUnlocked
                    ? `Conseguida el ${formatUnlockDate(unlockDate)}`
                    : achievement.hint}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
