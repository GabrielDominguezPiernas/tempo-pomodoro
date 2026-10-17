import { useCallback, useId } from 'react';

interface DurationStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  unit?: string;
}

export function DurationStepper({
  label,
  value,
  min,
  max,
  onChange,
  unit = 'min',
}: DurationStepperProps) {
  const id = useId();

  const handleDecrement = useCallback(() => {
    onChange(Math.max(min, value - 1));
  }, [value, min, onChange]);

  const handleIncrement = useCallback(() => {
    onChange(Math.min(max, value + 1));
  }, [value, max, onChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      if (!isNaN(newValue)) {
        onChange(Math.min(max, Math.max(min, newValue)));
      }
    },
    [min, max, onChange]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      if (isNaN(newValue) || newValue < min) {
        onChange(min);
      } else if (newValue > max) {
        onChange(max);
      }
    },
    [min, max, onChange]
  );

  return (
    <div className="duration-stepper">
      <label htmlFor={id} className="stepper-label">
        {label}
      </label>
      <div className="stepper-controls">
        <button
          type="button"
          className="stepper-btn"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label={`Reducir ${label.toLowerCase()}`}
        >
          −
        </button>
        <div className="stepper-input-wrapper">
          <input
            id={id}
            type="number"
            className="stepper-input"
            value={value}
            min={min}
            max={max}
            onChange={handleInputChange}
            onBlur={handleBlur}
            aria-label={`${label}${unit ? ` en ${unit}` : ''}`}
          />
          {unit && <span className="stepper-unit">{unit}</span>}
        </div>
        <button
          type="button"
          className="stepper-btn"
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label={`Aumentar ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
