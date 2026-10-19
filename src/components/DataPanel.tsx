import { useCallback, useRef, useState } from 'react';
import { SessionRecord } from '../lib/history';
import { TodoItem, validateTodosForImport, mergeTodos, loadTodos } from '../lib/todos';
import { RingGoals, GoalHistory, loadRingGoals, loadGoalHistory } from '../lib/ringGoals';
import { UnlockedMap, loadUnlocked } from '../lib/achievements';
import { ChallengeHistory, loadChallengeHistory } from '../lib/challenges';
import { InstallSection } from './InstallSection';

interface ExportDataV1 {
  app: 'pomodoro';
  version: 1;
  exportedAt: string;
  records: SessionRecord[];
  settings: {
    studyMinutes: number;
    breakMinutes: number;
    dailyGoal: number;
  };
}

interface ExportDataV2 {
  app: 'pomodoro';
  version: 2;
  exportedAt: string;
  records: SessionRecord[];
  settings: {
    studyMinutes: number;
    breakMinutes: number;
  };
  ringGoals: RingGoals;
  goalHistory: GoalHistory;
  unlocked: UnlockedMap;
  challengeHistory: ChallengeHistory;
  todos?: TodoItem[]; // Añadido como opcional para mantener compatibilidad
}

type ExportData = ExportDataV1 | ExportDataV2;

interface DataPanelProps {
  records: SessionRecord[];
  onImport: (records: SessionRecord[]) => void;
  todos?: TodoItem[];
  onImportTodos?: (todos: TodoItem[]) => void;
}

type ImportMode = 'merge' | 'replace' | null;

export function DataPanel({ records, onImport, todos, onImportTodos }: DataPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExport = useCallback(() => {
    // Obtener configuración actual
    const studyMinutes = parseInt(localStorage.getItem('pomodoro-study') || '25', 10);
    const breakMinutes = parseInt(localStorage.getItem('pomodoro-break') || '5', 10);

    // Cargar datos adicionales para v2
    const ringGoals = loadRingGoals();
    const goalHistory = loadGoalHistory();
    const unlocked = loadUnlocked();
    const challengeHistory = loadChallengeHistory();
    const todosToExport = todos ?? loadTodos();

    const data: ExportDataV2 = {
      app: 'pomodoro',
      version: 2,
      exportedAt: new Date().toISOString(),
      records,
      settings: {
        studyMinutes,
        breakMinutes,
      },
      ringGoals,
      goalHistory,
      unlocked,
      challengeHistory,
      todos: todosToExport,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    const filename = `pomodoro-backup-${date}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }, [records, todos]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImportError('El archivo es demasiado grande (máximo 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        // Validar estructura
        if (data.app !== 'pomodoro') {
          setImportError('Este archivo no es un backup de Pomodoro');
          return;
        }

        if (data.version !== 1 && data.version !== 2) {
          setImportError('Versión de backup no compatible');
          return;
        }

        if (!Array.isArray(data.records)) {
          setImportError('El archivo no contiene datos válidos');
          return;
        }

        // Validar registros
        const validRecords = data.records.filter(
          (r: unknown) =>
            r &&
            typeof r === 'object' &&
            typeof (r as SessionRecord).id === 'string' &&
            typeof (r as SessionRecord).sessionId === 'string' &&
            typeof (r as SessionRecord).endedAt === 'string' &&
            typeof (r as SessionRecord).dateKey === 'string' &&
            typeof (r as SessionRecord).hour === 'number' &&
            typeof (r as SessionRecord).studyMinutes === 'number'
        );

        if (validRecords.length === 0) {
          setImportError('El backup no contiene sesiones válidas');
          return;
        }

        setImportData({ ...data, records: validRecords });
        setImportError(null);
      } catch {
        setImportError('No se pudo leer el archivo');
      }
    };

    reader.onerror = () => {
      setImportError('Error al leer el archivo');
    };

    reader.readAsText(file);

    // Limpiar input para permitir seleccionar el mismo archivo
    e.target.value = '';
  }, []);

  const handleImportConfirm = useCallback(
    (mode: ImportMode) => {
      if (!importData || !mode) return;

      let newRecords: SessionRecord[];

      if (mode === 'replace') {
        newRecords = importData.records;
      } else {
        // Merge: combinar sin duplicados por ID
        const existingIds = new Set(records.map((r) => r.id));
        const newFromImport = importData.records.filter((r) => !existingIds.has(r.id));
        newRecords = [...records, ...newFromImport].sort(
          (a, b) => new Date(a.endedAt).getTime() - new Date(b.endedAt).getTime()
        );
      }

      // Para v2, importar datos adicionales directamente a localStorage
      if (importData.version === 2) {
        if (mode === 'replace') {
          if (importData.ringGoals) {
            localStorage.setItem('pomodoro-ring-goals-v1', JSON.stringify(importData.ringGoals));
          }
          if (importData.goalHistory) {
            localStorage.setItem('pomodoro-goal-history-v1', JSON.stringify(importData.goalHistory));
          }
          if (importData.unlocked) {
            localStorage.setItem('pomodoro-unlocked-v1', JSON.stringify(importData.unlocked));
          }
          if (importData.challengeHistory) {
            localStorage.setItem('pomodoro-challenges-v1', JSON.stringify(importData.challengeHistory));
          }
        }

        // Importar tareas si hay y tenemos el handler
        if (importData.todos && onImportTodos) {
          const validatedTodos = validateTodosForImport(importData.todos);
          if (validatedTodos.length > 0) {
            if (mode === 'replace') {
              onImportTodos(validatedTodos);
            } else {
              // Merge: combinar sin duplicados por ID
              const currentTodos = todos ?? loadTodos();
              const mergedTodos = mergeTodos(currentTodos, validatedTodos);
              onImportTodos(mergedTodos);
            }
          }
        }
      }

      onImport(newRecords);
      setImportData(null);
      setImportSuccess(true);

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setImportSuccess(false), 3000);
    },
    [importData, records, onImport, todos, onImportTodos]
  );

  const handleImportCancel = useCallback(() => {
    setImportData(null);
  }, []);

  return (
    <div className="data-panel">
      {/* Exportar */}
      <section className="data-section">
        <h3 className="data-title">Exportar datos</h3>
        <p className="data-description">
          Descarga un backup de tus {records.length} sesiones
          {todos && todos.length > 0 && ` y ${todos.length} tareas`}.
        </p>
        <button
          type="button"
          className="data-button"
          onClick={handleExport}
          disabled={records.length === 0 && (!todos || todos.length === 0)}
        >
          Descargar backup
        </button>
      </section>

      {/* Importar */}
      <section className="data-section">
        <h3 className="data-title">Importar datos</h3>
        <p className="data-description">
          Restaura un backup anterior.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="data-button data-button--secondary"
          onClick={handleFileSelect}
        >
          Seleccionar archivo
        </button>

        {importError && (
          <p className="data-error" role="alert">
            {importError}
          </p>
        )}

        {importSuccess && (
          <p className="data-success" role="status">
            ¡Datos importados correctamente!
          </p>
        )}
      </section>

      {/* Diálogo de confirmación de importación */}
      {importData && (
        <div className="import-dialog">
          <h4 className="import-dialog-title">Importar backup</h4>
          <p className="import-dialog-info">
            El backup contiene <strong>{importData.records.length}</strong> sesiones
            {importData.version === 2 && importData.todos && importData.todos.length > 0 && (
              <> y <strong>{validateTodosForImport(importData.todos).length}</strong> tareas</>
            )}
            <br />
            del {new Date(importData.exportedAt).toLocaleDateString('es-ES')}
          </p>
          <div className="import-dialog-actions">
            <button
              type="button"
              className="import-action import-action--merge"
              onClick={() => handleImportConfirm('merge')}
            >
              Combinar
              <span className="import-action-hint">Añadir sin duplicar</span>
            </button>
            <button
              type="button"
              className="import-action import-action--replace"
              onClick={() => handleImportConfirm('replace')}
            >
              Reemplazar
              <span className="import-action-hint">Borrar datos actuales</span>
            </button>
            <button
              type="button"
              className="import-action import-action--cancel"
              onClick={handleImportCancel}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Sección de instalación PWA */}
      <InstallSection />
    </div>
  );
}
