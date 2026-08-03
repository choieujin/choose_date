"use client";

import { WEEKDAY_HEAD, type MonthGrid } from "@/lib/domain";

// 호스트가 날짜를 토글 선택하는 달력.
// variant "block": 선택 시 빨강(잠금) / "allow": 선택 시 초록(허용)
export function DatePickerCalendar({
  months,
  selected,
  onToggle,
  variant,
}: {
  months: MonthGrid[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  variant: "block" | "allow";
}) {
  const onStyle =
    variant === "block"
      ? "bg-blush text-white border-blush"
      : "bg-sage text-white border-sage";

  return (
    <div className="space-y-4">
      {months.map((mo) => (
        <div key={mo.label}>
          <p className="font-serif-kr text-base font-bold text-ink text-center mb-2">
            {mo.label}
          </p>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_HEAD.map((w, i) => (
              <div
                key={w}
                className={`text-center text-[11px] py-0.5 ${
                  i === 0 ? "text-blush" : "text-ink-soft/60"
                }`}
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {mo.weeks.flat().map((cell, i) => {
              if (!cell) return <div key={i} />;
              if (!cell.isCandidate)
                return (
                  <div
                    key={i}
                    className="aspect-square flex items-center justify-center text-sm text-ink-soft/25"
                  >
                    {cell.day}
                  </div>
                );
              const on = selected.has(cell.key);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onToggle(cell.key)}
                  className={`aspect-square rounded-lg border text-sm font-medium transition ${
                    on
                      ? onStyle
                      : cell.isWeekend
                        ? "bg-white border-line text-blush hover:border-blush"
                        : "bg-white border-line text-ink hover:border-blush"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
