import { useEffect, useRef, useState, useCallback } from 'react';
import { SessionRecord } from '../lib/history';
import { UnlockedMap } from '../lib/achievements';
import { ThemeSettings } from '../lib/rewards';
import { RingGoals, GoalHistory } from '../lib/ringGoals';
import { StatsSummary } from './StatsSummary';
import { CalendarPanel } from './CalendarPanel';
import { BadgeGridV2 } from './BadgeGridV2';
import { SettingsPanel } from './SettingsPanel';

type Tab = 'summary' | 'calendar' | 'badges' | 'settings';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  records: SessionRecord[];
  unlocked: UnlockedMap;
  goals: RingGoals;
  goalHistory: GoalHistory;
  onPomodorosChange: (value: number) => void;
  onMinutesChange: (value: number) => void;
  theme: ThemeSettings;
  onAccentChange: (id: string) => void;
  onBackgroundChange: (id: string) => void;
  onSoundChange: (id: string) => void;
  onImportData?: (records: SessionRecord[]) => void;
}

export function SideMenu({
  isOpen,
  onClose,
  records,
  unlocked,
  goals,
  goalHistory,
  onPomodorosChange,
  onMinutesChange,
  theme,
  onAccentChange,
  onBackgroundChange,
  onSoundChange,
  onImportData,
}: SideMenuProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Atrapar foco y manejar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      // Atrapar Tab dentro del panel
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Mover foco al panel al abrir
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTabClick = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="menu-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id="side-menu"
        className="side-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
      >
        <div className="menu-header">
          <h2 className="menu-title">Tempo-Pomodoro</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="menu-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="menu-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`menu-tab${activeTab === 'summary' ? ' menu-tab--active' : ''}`}
            aria-selected={activeTab === 'summary'}
            onClick={() => handleTabClick('summary')}
          >
            Resumen
          </button>
          <button
            type="button"
            role="tab"
            className={`menu-tab${activeTab === 'calendar' ? ' menu-tab--active' : ''}`}
            aria-selected={activeTab === 'calendar'}
            onClick={() => handleTabClick('calendar')}
          >
            Calendario
          </button>
          <button
            type="button"
            role="tab"
            className={`menu-tab${activeTab === 'badges' ? ' menu-tab--active' : ''}`}
            aria-selected={activeTab === 'badges'}
            onClick={() => handleTabClick('badges')}
          >
            Insignias
          </button>
          <button
            type="button"
            role="tab"
            className={`menu-tab menu-tab--icon${activeTab === 'settings' ? ' menu-tab--active' : ''}`}
            aria-selected={activeTab === 'settings'}
            aria-label="Configuración"
            onClick={() => handleTabClick('settings')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        <div className="menu-content" role="tabpanel">
          {activeTab === 'summary' && (
            <StatsSummary
              records={records}
              goals={goals}
              goalHistory={goalHistory}
              onPomodorosChange={onPomodorosChange}
              onMinutesChange={onMinutesChange}
            />
          )}
          {activeTab === 'calendar' && (
            <CalendarPanel
              records={records}
              goalHistory={goalHistory}
            />
          )}
          {activeTab === 'badges' && (
            <BadgeGridV2
              unlocked={unlocked}
              records={records}
              goalHistory={goalHistory}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsPanel
              records={records}
              theme={theme}
              unlocked={unlocked}
              onAccentChange={onAccentChange}
              onBackgroundChange={onBackgroundChange}
              onSoundChange={onSoundChange}
              onImportData={onImportData}
            />
          )}
        </div>
      </div>
    </>
  );
}
