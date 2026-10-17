import { HeatmapDay } from '../lib/stats';

interface HeatmapProps {
  data: HeatmapDay[][];
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getIntensity(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function Heatmap({ data }: HeatmapProps) {
  // Transponer: de semanas × días a días × semanas para mostrar días como filas
  const rows: HeatmapDay[][] = [];
  for (let day = 0; day < 7; day++) {
    rows.push(data.map((week) => week[day]));
  }

  return (
    <div className="heatmap">
      <div className="heatmap-labels">
        {[0, 2, 4].map((i) => (
          <span key={i} className="heatmap-label">
            {DAY_LABELS[i]}
          </span>
        ))}
      </div>
      <div className="heatmap-grid">
        {rows.map((row, dayIndex) => (
          <div key={dayIndex} className="heatmap-row">
            {row.map((cell) => {
              const intensity = cell.isFuture ? 0 : getIntensity(cell.count);
              const label = `${formatDateLabel(cell.dateKey)}: ${cell.count} pomodoros`;
              return (
                <div
                  key={cell.dateKey}
                  className={`heatmap-cell heatmap-cell--${intensity}${cell.isToday ? ' heatmap-cell--today' : ''}${cell.isFuture ? ' heatmap-cell--future' : ''}`}
                  title={label}
                  aria-label={label}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
