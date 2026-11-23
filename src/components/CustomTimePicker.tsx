import React, { useState } from 'react';

interface CustomTimePickerProps {
  /** Selected time in HH:mm (24h) format */
  value?: string;
  /** Called when user confirms selection */
  onChange: (time: string) => void;
  /** Optional: close handler for cancel */
  onCancel?: () => void;
}

/**
 * Dark‑theme time picker
 * - Hours 0‑23 (or 1‑12 with AM/PM toggle)
 * - Minutes 0‑59 in 5‑minute steps
 * - Mobile‑friendly touch targets
 * - Confirm & Cancel buttons
 */
export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ value, onChange, onCancel }) => {
  // Parse initial value or default to current time rounded to nearest 5 minutes
  const now = new Date();
  const defaultHour = now.getHours();
  const defaultMinute = Math.round(now.getMinutes() / 5) * 5 % 60;

  const initial = value ? value : `${defaultHour.toString().padStart(2, '0')}:${defaultMinute.toString().padStart(2, '0')}`;
  const [hour, setHour] = useState<number>(parseInt(initial.split(':')[0]));
  const [minute, setMinute] = useState<number>(parseInt(initial.split(':')[1]));
  const [isPm, setIsPm] = useState<boolean>(hour >= 12);

  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  const confirm = () => {
    const h24 = isPm ? (displayHour % 12) + 12 : displayHour % 12;
    const timeStr = `${h24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(timeStr);
  };

  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className="flex flex-col items-center bg-[#0d1528] p-4 rounded-xl border border-white/10">
      <div className="flex space-x-4 mb-4">
        {/* Hour selector */}
        <select
          value={displayHour}
          onChange={e => setHour(parseInt(e.target.value) % 12 + (isPm ? 12 : 0))}
          className="bg-[#1a1a1f] text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#ff6d59]"
        >
          {hourOptions.map(h => (
            <option key={h} value={h}>
              {h.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
        {/* Minute selector */}
        <select
          value={minute}
          onChange={e => setMinute(parseInt(e.target.value))}
          className="bg-[#1a1a1f] text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#ff6d59]"
        >
          {minuteOptions.map(m => (
            <option key={m} value={m}>
              {m.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
        {/* AM/PM toggle */}
        <button
          type="button"
          onClick={() => setIsPm(!isPm)}
          className="bg-[#ff6d59] text-black rounded-md px-3 py-2 hover:bg-[#ff8a5b]"
        >
          {isPm ? 'PM' : 'AM'}
        </button>
      </div>
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={confirm}
          className="bg-[#ff6d59] text-black rounded-md px-4 py-2 hover:bg-[#ff8a5b]"
        >
          Confirm
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#4a4a4a] text-white rounded-md px-4 py-2 hover:bg-[#5a5a5a]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
