import { useState, useEffect, useCallback } from 'react';
import {
  SessionRecord,
  loadHistory,
  saveHistory,
  addRecord,
  addMissedPomodoros,
} from '../lib/history';

interface UseHistoryReturn {
  records: SessionRecord[];
  addSession: (studyMinutes: number, sessionId: string, pomodoroNumber: number) => void;
  addMissedSessions: (
    studyMinutes: number,
    sessionId: string,
    startingPomodoroNumber: number,
    count: number
  ) => void;
  reloadRecords: () => void;
  importRecords: (newRecords: SessionRecord[]) => void;
}

export function useHistory(): UseHistoryReturn {
  const [records, setRecords] = useState<SessionRecord[]>(() => loadHistory());

  // Sincronizar con localStorage cuando cambia en otra pestaña
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pomodoro-history-v1' && e.newValue) {
        setRecords(loadHistory());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addSession = useCallback(
    (studyMinutes: number, sessionId: string, pomodoroNumber: number) => {
      setRecords((prev) => {
        const updated = addRecord(prev, studyMinutes, sessionId, pomodoroNumber);
        saveHistory(updated);
        return updated;
      });
    },
    []
  );

  const addMissedSessions = useCallback(
    (
      studyMinutes: number,
      sessionId: string,
      startingPomodoroNumber: number,
      count: number
    ) => {
      setRecords((prev) => {
        const updated = addMissedPomodoros(
          prev,
          studyMinutes,
          sessionId,
          startingPomodoroNumber,
          count
        );
        saveHistory(updated);
        return updated;
      });
    },
    []
  );

  const reloadRecords = useCallback(() => {
    setRecords(loadHistory());
  }, []);

  const importRecords = useCallback((newRecords: SessionRecord[]) => {
    setRecords(newRecords);
    saveHistory(newRecords);
  }, []);

  return { records, addSession, addMissedSessions, reloadRecords, importRecords };
}
