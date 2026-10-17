import { useEffect, useRef, useState, useCallback } from 'react';
import { SessionRecord } from '../lib/history';
import { UnlockedMap } from '../lib/achievements';
import { ThemeSettings } from '../lib/rewards';
import { RingGoals, GoalHistory } from '../lib/ringGoals';
import { StatsSummary } from './StatsSummary';
import { BadgeGridV2 } from './BadgeGridV2';
import { RewardsPicker } from './RewardsPicker';
import { DataPanel } from './DataPanel';

type Tab = 'summary' | 'badges' | 'customize' | 'data';

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
          <h2 className="menu-title">Pomodoro</h2>
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
            className={`menu-tab${activeTab === 'badges' ? ' menu-tab--active' : ''}`}
            aria-selected={activeTab === 'badges'}
            onClick={() => handleTabClick('badges')}
          >
            Insignias
          </button>
          <button
            type="button"
            role="tab"
            className={`menu-tab${activeTab === 'customize' ? ' menu-tab--active' : ''}`}
            aria-selected={activeTab === 'customize'}
            onClick={() => handleTabClick('customize')}
          >
            Personalizar
          </button>
          <button
            type="button"
            role="tab"
            className={`menu-tab${activeTab === 'data' ? ' menu-tab--active' : ''}`}
            aria-selected={activeTab === 'data'}
            onClick={() => handleTabClick('data')}
          >
            Datos
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
          {activeTab === 'badges' && (
            <BadgeGridV2
              unlocked={unlocked}
              records={records}
              goalHistory={goalHistory}
            />
          )}
          {activeTab === 'customize' && (
            <RewardsPicker
              theme={theme}
              unlocked={unlocked}
              onAccentChange={onAccentChange}
              onBackgroundChange={onBackgroundChange}
              onSoundChange={onSoundChange}
            />
          )}
          {activeTab === 'data' && onImportData && (
            <DataPanel
              records={records}
              onImport={onImportData}
            />
          )}
        </div>
      </div>
    </>
  );
}
