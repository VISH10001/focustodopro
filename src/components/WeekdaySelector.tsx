// WeekdaySelector.tsx
// Component for selecting specific weekdays with dates, supporting multiple selection.
// Dark theme compatible, responsive for mobile.
import React, { useEffect, useState } from 'react';

interface WeekdayOption {
  day: number; // 0 (Sun) - 6 (Sat)
  short: string; // Mon, Tue, etc.
  date: string; // e.g., "23 Nov"
}

interface Props {
  /** Currently selected weekday numbers */
  selected: number[];
  /** Callback when selection changes */
  onChange: (selected: number[]) => void;
}

/** Utility: get Monday of the week for a given date */
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

/** Utility: format date as "dd MMM" */
const formatDisplay = (d: Date) => {
  const day = d.getDate();
  const month = d.toLocaleString('default', { month: 'short' });
  return `${day} ${month}`;
};

export const WeekdaySelector: React.FC<Props> = ({ selected, onChange }) => {
  const [options, setOptions] = useState<WeekdayOption[]>([]);

  // Build the 7 days starting Monday of the current week
  useEffect(() => {
    const today = new Date();
    const monday = getMonday(today);
    const opts: WeekdayOption[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const short = d.toLocaleString('default', { weekday: 'short' }); // Mon, Tue, ...
      opts.push({
        day: d.getDay(),
        short,
        date: formatDisplay(d),
      });
    }
    setOptions(opts);
  }, []);

  const toggle = (day: number) => {
    if (selected.includes(day)) {
      onChange(selected.filter((s) => s !== day));
    } else {
      onChange([...selected, day]);
    }
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.day);
        return (
          <button
            key={opt.day}
            type="button"
            onClick={() => toggle(opt.day)}
            className={`flex flex-col items-center rounded-md px-2 py-1 text-xs transition ${isSelected ? 'bg-[#ef5350] text-white' : 'bg-[#222227] text-gray-300'} hover:bg-[#ef5350]/80`}
          >
            <span className="font-medium">{opt.short}</span>
            <span className="text-[10px]">{opt.date}</span>
          </button>
        );
      })}
    </div>
  );
};
