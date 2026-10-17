/**
 * Panel de configuración que agrupa Personalizar y Datos
 */

import { useState } from 'react';
import { SessionRecord } from '../lib/history';
import { UnlockedMap } from '../lib/achievements';
import { ThemeSettings } from '../lib/rewards';
import { RewardsPicker } from './RewardsPicker';
import { DataPanel } from './DataPanel';

type SettingsSection = 'customize' | 'data';

interface SettingsPanelProps {
  records: SessionRecord[];
  theme: ThemeSettings;
  unlocked: UnlockedMap;
  onAccentChange: (id: string) => void;
  onBackgroundChange: (id: string) => void;
  onSoundChange: (id: string) => void;
  onImportData?: (records: SessionRecord[]) => void;
}

export function SettingsPanel({
  records,
  theme,
  unlocked,
  onAccentChange,
  onBackgroundChange,
  onSoundChange,
  onImportData,
}: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('customize');

  return (
    <div className="settings-panel">
      <div className="settings-tabs">
        <button
          type="button"
          className={`settings-tab${activeSection === 'customize' ? ' settings-tab--active' : ''}`}
          onClick={() => setActiveSection('customize')}
        >
          Personalizar
        </button>
        <button
          type="button"
          className={`settings-tab${activeSection === 'data' ? ' settings-tab--active' : ''}`}
          onClick={() => setActiveSection('data')}
        >
          Datos
        </button>
      </div>

      <div className="settings-content">
        {activeSection === 'customize' && (
          <RewardsPicker
            theme={theme}
            unlocked={unlocked}
            onAccentChange={onAccentChange}
            onBackgroundChange={onBackgroundChange}
            onSoundChange={onSoundChange}
          />
        )}
        {activeSection === 'data' && onImportData && (
          <DataPanel
            records={records}
            onImport={onImportData}
          />
        )}
      </div>
    </div>
  );
}
