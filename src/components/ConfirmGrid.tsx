"use client";

import { useState, useTransition } from "react";
import type { Slot } from "@prisma/client";
import { confirmSlot, unconfirm } from "@/lib/actions";
import { SLOT_LABEL } from "@/lib/domain";

export interface ConfirmRow {
  key: string; // YYYY-MM-DD
  label: string;
  isWeekend: boolean;
  yes: number;
  maybe: number;
  freeSlots: Slot[]; // 확정 가능한 슬롯
  lockedSlots: { slot: Slot; name: string }[]; // 다른 그룹이 잡음
  isBest: boolean;
}

export function ConfirmGrid({
  hostToken,
  groupId,
  rows,
  current,
}: {
  hostToken: string;
  groupId: string;
  rows: ConfirmRow[];
  current: { date: string; slot: Slot } | null;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function doConfirm(date: string, slot: Slot) {
    setMsg(null);
    start(async () => {
      const res = await confirmSlot(hostToken, groupId, date, slot);
      if (!res.ok) setMsg(res.error ?? "확정 실패");
    });
  }
  function doUnconfirm() {
    setMsg(null);
    start(async () => {
      await unconfirm(hostToken, groupId);
    });
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-ink-soft text-center py-6">
        아직 아무도 투표하지 않았어요. 멤버들이 투표하면 여기 날짜가 뜹니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {msg && (
        <p className="rounded-lg bg-blush-soft text-blush px-3 py-2 text-sm">
          {msg}
        </p>
      )}

      <ul className="space-y-2">
        {rows.map((r) => {
          const isCurrentDate = current?.date === r.key;
          return (
            <li
              key={r.key}
              className={`card p-3 flex items-center gap-3 ${
                isCurrentDate ? "ring-2 ring-blush" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div
                  className={`font-medium ${
                    r.isWeekend ? "text-blush" : "text-ink"
                  }`}
                >
                  {r.label}
                  {r.isBest && (
                    <span className="ml-2 text-[10px] rounded-full bg-sage-soft text-sage px-1.5 py-0.5 align-middle">
                      최다
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-soft mt-0.5">
                  <span className="text-sage">가능 {r.yes}</span>
                  {r.maybe > 0 && <span className="ml-2">애매 {r.maybe}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {r.lockedSlots.map((l) => (
                  <span
                    key={l.slot}
                    title={`${l.name} 모임이 잡힘`}
                    className="rounded-lg border border-line bg-cream-deep/40 px-2.5 py-2 text-xs text-ink-soft/50"
                  >
                    🔒 {SLOT_LABEL[l.slot]}
                  </span>
                ))}
                {r.freeSlots.map((s) => {
                  const isCurrent =
                    current?.date === r.key && current?.slot === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        isCurrent ? doUnconfirm() : doConfirm(r.key, s)
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-medium border transition disabled:opacity-50 ${
                        isCurrent
                          ? "bg-blush text-white border-blush"
                          : "bg-white border-line text-ink hover:border-blush"
                      }`}
                    >
                      {SLOT_LABEL[s]}
                      {isCurrent ? " 확정 ✓" : " 확정"}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-ink-soft/70">
        슬롯 버튼을 누르면 그 날로 확정돼요. 확정하면 다른 그룹에서 그 시간은 잠깁니다.
        확정된 버튼을 다시 누르면 해제.
      </p>
    </div>
  );
}
