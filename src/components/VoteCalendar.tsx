"use client";

import { useState, useTransition } from "react";
import type { SlotPref, VoteStatus } from "@prisma/client";
import { submitVotes, type DateVoteInput } from "@/lib/actions";
import { WEEKDAY_HEAD, type MonthGrid } from "@/lib/domain";

// 탭 순환: 없음 → 가능(YES) → 애매(MAYBE) → 불가(NO) → 없음
const NEXT: Record<string, VoteStatus | undefined> = {
  none: "YES",
  YES: "MAYBE",
  MAYBE: "NO",
  NO: undefined,
};

const CELL_STYLE: Record<VoteStatus, string> = {
  YES: "bg-sage text-white border-sage",
  MAYBE: "bg-gold/80 text-white border-gold/80",
  NO: "bg-ink-soft/70 text-white/90 border-ink-soft/70 line-through",
};

const PREF_CHOICES: { value: SlotPref; label: string }[] = [
  { value: "LUNCH", label: "점심" },
  { value: "DINNER", label: "저녁" },
  { value: "EITHER", label: "둘다 좋아요" },
];

export function VoteCalendar({
  memberToken,
  months,
  initial,
  lockedDates,
  showSlotPref,
  initialPref,
}: {
  memberToken: string;
  months: MonthGrid[];
  initial: Record<string, VoteStatus>;
  lockedDates: Record<string, string>;
  showSlotPref: boolean;
  initialPref: SlotPref | null;
}) {
  const [state, setState] = useState<Record<string, VoteStatus>>(initial);
  const [pref, setPref] = useState<SlotPref | null>(initialPref);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function cycle(key: string) {
    setSaved(false);
    setState((prev) => {
      const cur = prev[key] ?? "none";
      const next = NEXT[cur];
      const copy = { ...prev };
      if (next) copy[key] = next;
      else delete copy[key];
      return copy;
    });
  }

  const answered = Object.keys(state).length;

  function onSubmit() {
    setErr(null);
    if (showSlotPref && !pref) {
      setErr("점심/저녁 선호를 골라주세요.");
      return;
    }
    const votes: DateVoteInput[] = Object.entries(state)
      .filter(([k]) => !lockedDates[k])
      .map(([date, status]) => ({ date, status }));

    start(async () => {
      const res = await submitVotes(
        memberToken,
        votes,
        showSlotPref ? (pref ?? "EITHER") : null,
      );
      if (res.ok) setSaved(true);
      else setErr(res.error ?? "저장 실패");
    });
  }

  return (
    <div className="space-y-6">
      {/* 범례 */}
      <div className="flex justify-center gap-3 text-xs text-ink-soft">
        <Legend cls="bg-sage" label="가능" />
        <Legend cls="bg-gold/80" label="애매" />
        <Legend cls="bg-ink-soft/70" label="불가" />
        <span className="text-ink-soft/60">· 날짜를 눌러 바꿔요</span>
      </div>

      {/* 달력들 */}
      <div className="space-y-6">
        {months.map((mo) => (
          <div key={mo.label} className="card p-4">
            <p className="font-serif-kr text-lg font-bold text-ink text-center mb-3">
              {mo.label}
            </p>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_HEAD.map((w, i) => (
                <div
                  key={w}
                  className={`text-center text-[11px] py-1 ${
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
                const locked = lockedDates[cell.key];
                if (locked)
                  return (
                    <div
                      key={i}
                      title={`${locked} 모임이 잡힌 날`}
                      className="aspect-square flex items-center justify-center rounded-lg border border-line bg-cream-deep/40 text-[11px] text-ink-soft/40"
                    >
                      🔒
                    </div>
                  );
                const st = state[cell.key];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => cycle(cell.key)}
                    className={`aspect-square rounded-lg border text-sm font-medium transition ${
                      st
                        ? CELL_STYLE[st]
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

      {/* 점심/저녁 선호 (BOTH 그룹만) */}
      {showSlotPref && (
        <div className="card p-4">
          <p className="text-sm text-ink mb-3">
            점심·저녁 중 <b>선호</b>하는 시간대는? (한 번만 골라요)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PREF_CHOICES.map((c) => {
              const active = pref === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setSaved(false);
                    setPref(c.value);
                  }}
                  className={`rounded-lg py-2.5 text-sm border transition ${
                    active
                      ? "bg-blush text-white border-blush"
                      : "bg-white border-line text-ink-soft hover:border-blush"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {err && <p className="text-sm text-blush text-center">{err}</p>}

      <div className="sticky bottom-4">
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending || answered === 0}
          className="w-full rounded-full bg-blush py-3.5 text-white font-medium shadow-lg disabled:opacity-40 hover:brightness-105 active:scale-[.99] transition"
        >
          {pending
            ? "저장 중…"
            : saved
              ? "저장됐어요 ✓ (수정하면 다시 저장)"
              : `제출하기 (${answered}일 선택)`}
        </button>
      </div>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-3 w-3 rounded ${cls}`} />
      {label}
    </span>
  );
}
