"use client";

import { useState, useTransition } from "react";
import type { MonthGrid } from "@/lib/domain";
import { setGroupDates } from "@/lib/actions";
import { DatePickerCalendar } from "./DatePickerCalendar";

export function GroupDatesEditor({
  hostToken,
  groupId,
  months,
  initial,
}: {
  hostToken: string;
  groupId: string;
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
      await setGroupDates(hostToken, groupId, [...selected]);
      setSaved(true);
    });
  }

  const limited = selected.size > 0;

  return (
    <div className="card p-5 mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <span className="font-serif-kr text-base font-bold text-ink">
          이 그룹이 고를 수 있는 날짜
        </span>
        <span className="text-sm text-ink-soft">
          {limited ? `${selected.size}일만` : "전체"} {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="mt-4">
          <p className="text-sm text-ink-soft mb-3">
            열어줄 날짜를 누르세요 (초록). <b>아무것도 안 고르면 전체 날짜가 열려요.</b>
          </p>
          <DatePickerCalendar
            months={months}
            selected={selected}
            onToggle={toggle}
            variant="allow"
          />
          <div className="mt-3 flex gap-2">
            {limited && (
              <button
                type="button"
                onClick={() => {
                  setSaved(false);
                  setSelected(new Set());
                }}
                className="rounded-full border border-line px-4 py-2.5 text-sm text-ink-soft hover:border-blush transition"
              >
                전체 허용
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="flex-1 rounded-full bg-ink py-2.5 text-white font-medium disabled:opacity-40 hover:brightness-110 transition"
            >
              {pending ? "저장 중…" : saved ? "저장됐어요 ✓" : "저장하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
