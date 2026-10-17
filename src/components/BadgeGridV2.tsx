/**
 * Grid de insignias rediseñado con:
 * - Agrupación por categorías
 * - Barras de progreso
 * - Panel de detalle expandido
 */

import { useState, useMemo } from 'react';
import {
  ACHIEVEMENTS,
  UnlockedMap,
  TIER_COLORS,
  Category,
  Achievement,
  getAchievementProgress,
} from '../lib/achievements';
import { buildContext } from '../lib/stats';
import { SessionRecord } from '../lib/history';
import { GoalHistory } from '../lib/ringGoals';
import { Medal, TierBadge } from './Medal';

interface BadgeGridV2Props {
  unlocked: UnlockedMap;
  records: SessionRecord[];
  goalHistory: GoalHistory;
}

function formatUnlockDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatProgress(current: number, target: number): string {
  if (target >= 60) {
    // Para horas (convertidas a minutos en el target)
    const currentHours = Math.floor(current / 60);
    const targetHours = Math.floor(target / 60);
    return `${currentHours} / ${targetHours}`;
  }
  return `${Math.min(current, target)} / ${target}`;
}

// Agrupar categorías similares para la UI
const CATEGORY_GROUPS: { name: string; categories: Category[] }[] = [
  { name: 'Constancia', categories: ['constancia'] },
  { name: 'Objetivos', categories: ['objetivo'] },
  { name: 'Pomodoros', categories: ['pomodoros'] },
  { name: 'Tiempo', categories: ['tiempo'] },
  { name: 'Día y sesión', categories: ['dia', 'sesion'] },
  { name: 'Semana', categories: ['semana'] },
  { name: 'Anillos', categories: ['anillos'] },
  { name: 'Especiales', categories: ['especiales'] },
  { name: 'Retos', categories: ['retos'] },
];

export function BadgeGridV2({ unlocked, records, goalHistory }: BadgeGridV2Props) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Contexto de stats memoizado
  const context = useMemo(() => {
    if (records.length === 0) return null;
    return buildContext(records, goalHistory);
  }, [records, goalHistory]);

  // Contar logros
  const unlockedCount = Object.keys(unlocked).filter((id) =>
    ACHIEVEMENTS.some((a) => a.id === id)
  ).length;

  // Agrupar achievements por grupo de categoría
  const groupedAchievements = useMemo(() => {
    const groups = new Map<string, Achievement[]>();
    for (const group of CATEGORY_GROUPS) {
      const achievements = ACHIEVEMENTS.filter((a) =>
        group.categories.includes(a.category)
      );
      if (achievements.length > 0) {
        groups.set(group.name, achievements);
      }
    }
    return groups;
  }, []);

  // Stats por grupo
  const groupStats = useMemo(() => {
    const stats = new Map<string, { unlocked: number; total: number }>();
    groupedAchievements.forEach((achievements, groupName) => {
      const unlockedInGroup = achievements.filter((a) => !!unlocked[a.id]).length;
      stats.set(groupName, { unlocked: unlockedInGroup, total: achievements.length });
    });
    return stats;
  }, [groupedAchievements, unlocked]);

  const handleMedalClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };

  const closeDetail = () => {
    setSelectedAchievement(null);
  };

  const toggleCategory = (groupName: string) => {
    setExpandedCategory(expandedCategory === groupName ? null : groupName);
  };

  return (
    <div className="badge-grid-v2">
      {/* Header con contador */}
      <div className="badge-header">
        <div className="badge-header-count">
          <span className="badge-count-number">{unlockedCount}</span>
          <span className="badge-count-total">/ {ACHIEVEMENTS.length}</span>
        </div>
        <span className="badge-header-text">insignias conseguidas</span>
      </div>

      {/* Barra de progreso global */}
      <div className="badge-progress-bar">
        <div
          className="badge-progress-fill"
          style={{
            width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%`,
          }}
        />
      </div>

      {/* Grupos de categorías */}
      <div className="badge-categories">
        {CATEGORY_GROUPS.map((group) => {
          const achievements = groupedAchievements.get(group.name);
          if (!achievements || achievements.length === 0) return null;

          const stats = groupStats.get(group.name)!;
          const isExpanded = expandedCategory === group.name;
          const allUnlocked = stats.unlocked === stats.total;

          return (
            <div key={group.name} className="badge-category">
              <button
                type="button"
                className={`badge-category-header${isExpanded ? ' badge-category-header--expanded' : ''}`}
                onClick={() => toggleCategory(group.name)}
                aria-expanded={isExpanded}
              >
                <span className="badge-category-name">{group.name}</span>
                <span className="badge-category-count">
                  {stats.unlocked} / {stats.total}
                  {allUnlocked && ' ✓'}
                </span>
                <span className="badge-category-chevron" aria-hidden="true">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>

              {isExpanded && (
                <div className="badge-category-content">
                  <div className="badge-medals-grid">
                    {achievements.map((achievement) => {
                      const isUnlocked = !!unlocked[achievement.id];
                      const progress = context
                        ? getAchievementProgress(achievement, context)
                        : 0;

                      return (
                        <div key={achievement.id} className="badge-medal-item">
                          <Medal
                            emoji={achievement.emoji}
                            tier={achievement.tier}
                            name={achievement.name}
                            unlocked={isUnlocked}
                            onClick={() => handleMedalClick(achievement)}
                            size="medium"
                          />
                          {!isUnlocked && (
                            <div className="badge-medal-progress">
                              <div
                                className="badge-medal-progress-fill"
                                style={{
                                  width: `${progress * 100}%`,
                                  backgroundColor: TIER_COLORS[achievement.tier],
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel de detalle */}
      {selectedAchievement && (
        <>
          <div
            className="badge-detail-overlay"
            onClick={closeDetail}
            aria-hidden="true"
          />
          <div
            className="badge-detail-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="badge-detail-title"
          >
            <button
              type="button"
              className="badge-detail-close"
              onClick={closeDetail}
              aria-label="Cerrar"
            >
              ×
            </button>

            <div className="badge-detail-content">
              <div className="badge-detail-medal">
                <Medal
                  emoji={selectedAchievement.emoji}
                  tier={selectedAchievement.tier}
                  name={selectedAchievement.name}
                  unlocked={!!unlocked[selectedAchievement.id]}
                  size="large"
                />
              </div>

              <h3 id="badge-detail-title" className="badge-detail-name">
                {selectedAchievement.name}
              </h3>

              <TierBadge tier={selectedAchievement.tier} />

              <p className="badge-detail-description">
                {selectedAchievement.description}
              </p>

              {unlocked[selectedAchievement.id] ? (
                <p className="badge-detail-unlocked">
                  Conseguida el {formatUnlockDate(unlocked[selectedAchievement.id])}
                </p>
              ) : (
                <div className="badge-detail-progress-section">
                  <p className="badge-detail-hint">{selectedAchievement.hint}</p>
                  {context && (
                    <div className="badge-detail-progress">
                      <div className="badge-detail-progress-bar">
                        <div
                          className="badge-detail-progress-fill"
                          style={{
                            width: `${getAchievementProgress(selectedAchievement, context) * 100}%`,
                            backgroundColor: TIER_COLORS[selectedAchievement.tier],
                          }}
                        />
                      </div>
                      <span className="badge-detail-progress-text">
                        {formatProgress(
                          selectedAchievement.progress(context),
                          selectedAchievement.target
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
