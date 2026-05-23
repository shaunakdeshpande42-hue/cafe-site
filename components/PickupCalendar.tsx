"use client";

import { useState } from "react";

interface Props {
  selectedDateKey: string; // "YYYY-MM-DD"
  onChange: (dateKey: string) => void;
  daysAhead?: number;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default function PickupCalendar({ selectedDateKey, onChange, daysAhead = 14 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + daysAhead - 1);

  // Calendar view month (starts at today's month)
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // Build the grid for the current view month
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset  = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Can we navigate prev / next?
  const prevMonthDate = new Date(viewYear, viewMonth - 1, 1);
  const nextMonthDate = new Date(viewYear, viewMonth + 1, 1);

  // Previous month only if it contains selectable days (i.e., today is in that month)
  const canGoPrev = sameMonth(prevMonthDate, today) || prevMonthDate > today;
  // Next month only if it contains selectable days
  const nextMonthFirst = new Date(viewYear, viewMonth + 1, 1);
  const canGoNext = nextMonthFirst <= maxDate;

  function prevMonth() {
    if (!canGoPrev) return;
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function nextMonth() {
    if (!canGoNext) return;
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-IN", {
    month: "long", year: "numeric",
  });

  // Build cells: nulls for offset, then day numbers
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="border border-cream-dark bg-white select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cream-dark">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center text-charcoal/40 hover:text-burgundy disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <span className="font-serif text-base text-charcoal">{monthLabel}</span>

        <button
          onClick={nextMonth}
          disabled={!canGoNext}
          className="w-8 h-8 flex items-center justify-center text-charcoal/40 hover:text-burgundy disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          aria-label="Next month"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-cream-dark">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] tracking-widest uppercase font-sans text-charcoal/30">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 p-2 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const cellDate = new Date(viewYear, viewMonth, day);
          cellDate.setHours(0, 0, 0, 0);
          const key = toKey(cellDate);

          const isToday    = key === toKey(today);
          const isSelected = key === selectedDateKey;
          const isPast     = cellDate < today;
          const isFuture   = cellDate > maxDate;
          const isDisabled = isPast || isFuture;

          return (
            <button
              key={key}
              onClick={() => !isDisabled && onChange(key)}
              disabled={isDisabled}
              className={`
                aspect-square flex items-center justify-center text-sm font-sans rounded-sm transition-all duration-150
                ${isSelected
                  ? "bg-burgundy text-cream font-medium"
                  : isToday && !isDisabled
                  ? "border border-burgundy text-burgundy font-medium hover:bg-burgundy hover:text-cream"
                  : isDisabled
                  ? "text-charcoal/20 cursor-not-allowed"
                  : "text-charcoal hover:bg-blush-light hover:text-burgundy cursor-pointer"
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-cream-dark flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border border-burgundy" />
          <span className="text-[10px] font-sans text-charcoal/40 uppercase tracking-wider">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-burgundy" />
          <span className="text-[10px] font-sans text-charcoal/40 uppercase tracking-wider">Selected</span>
        </div>
      </div>
    </div>
  );
}
