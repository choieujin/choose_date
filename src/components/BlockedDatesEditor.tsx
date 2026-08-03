"use client";

import { useState, useTransition } from "react";
import type { MonthGrid } from "@/lib/domain";
import { setBlockedDates } from "@/lib/actions";
import { DatePickerCalendar } from "./DatePickerCalendar";

export function BlockedDatesEditor({
  hostToken,
  months,
  initial,
}: {
  hostToken: string;
  months: MonthGrid[];
  initial: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function toggle(key: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function save() {
    start(async () => {
      await setBlockedDates(hostToken, [...selected]);
      setSaved(true);
    });
  }

  return (
    <section className="card p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <span className="font-serif-kr text-lg font-bold text-ink">
          내 개인 일정 잠금
        </span>
        <span className="text-sm text-ink-soft">
          {selected.size > 0 ? `${selected.size}일 잠금` : "없음"} {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="mt-4">
          <p className="text-sm text-ink-soft mb-3">
            내가 안 되는 날을 누르면 <b className="text-blush">모든 그룹</b> 후보에서
            빠져요. (빨강 = 잠금)
          </p>
          <DatePickerCalendar
            months={months}
            selected={selected}
            onToggle={toggle}
            variant="block"
          />
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="mt-4 w-full rounded-full bg-ink py-3 text-white font-medium disabled:opacity-40 hover:brightness-110 transition"
          >
            {pending ? "저장 중…" : saved ? "저장됐어요 ✓" : "저장하기"}
          </button>
        </div>
      )}
    </section>
  );
}
