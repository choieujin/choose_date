"use client";

import { useState, useTransition } from "react";
import type { SlotType } from "@prisma/client";
import { splitGroupToNew, moveMembersToGroup } from "@/lib/actions";

export interface SimpleMember {
  id: string;
  name: string;
}
export interface OtherGroup {
  id: string;
  name: string;
}

export function SplitGroupPanel({
  hostToken,
  sourceGroupId,
  members,
  otherGroups,
  sourceSlotType,
}: {
  hostToken: string;
  sourceGroupId: string;
  members: SimpleMember[];
  otherGroups: OtherGroup[];
  sourceSlotType: SlotType;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [name, setName] = useState("");
  const [slotType, setSlotType] = useState<SlotType>(sourceSlotType);
  const [targetId, setTargetId] = useState(otherGroups[0]?.id ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(id: string) {
    setErr(null);
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run() {
    setErr(null);
    const ids = [...picked];
    if (ids.length === 0) {
      setErr("나눌 멤버를 선택해주세요.");
      return;
    }
    start(async () => {
      if (mode === "new") {
        const res = await splitGroupToNew(
          hostToken,
          sourceGroupId,
          ids,
          name,
          slotType,
        );
        if (res && !res.ok) setErr(res.error ?? "실패했어요.");
        // 성공 시 새 그룹으로 리다이렉트됨
      } else {
        if (!targetId) {
          setErr("이동할 그룹을 골라주세요.");
          return;
        }
        const res = await moveMembersToGroup(
          hostToken,
          sourceGroupId,
          ids,
          targetId,
        );
        if (res?.ok) setPicked(new Set());
        else setErr(res?.error ?? "실패했어요.");
      }
    });
  }

  if (members.length === 0) return null;

  return (
    <div className="card p-5 mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <span className="font-serif-kr text-base font-bold text-ink">
          그룹 나누기 · 멤버 이동
        </span>
        <span className="text-sm text-ink-soft">
          {picked.size > 0 ? `${picked.size}명 선택` : ""} {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* 멤버 선택 */}
          <div>
            <p className="text-sm text-ink-soft mb-2">나눌 멤버를 고르세요</p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const on = picked.has(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m.id)}
                    className={`rounded-full px-3 py-1.5 text-sm border transition ${
                      on
                        ? "bg-sage text-white border-sage"
                        : "bg-white text-ink-soft border-line hover:border-blush"
                    }`}
                  >
                    {on ? "✓ " : ""}
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 대상 선택 */}
          <div className="flex gap-1.5 rounded-full bg-cream-deep/50 p-0.5 w-fit">
            <ModeTab
              active={mode === "new"}
              onClick={() => setMode("new")}
              label="새 그룹으로"
            />
            <ModeTab
              active={mode === "existing"}
              onClick={() => setMode("existing")}
              label="기존 그룹으로"
              disabled={otherGroups.length === 0}
            />
          </div>

          {mode === "new" ? (
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="새 그룹 이름 (예: 14오빠들 2차)"
                className="w-full rounded-lg border border-line bg-cream/40 px-3.5 py-2.5 outline-none focus:border-blush focus:bg-white transition"
              />
              <select
                value={slotType}
                onChange={(e) => setSlotType(e.target.value as SlotType)}
                className="w-full rounded-lg border border-line bg-cream/40 px-3.5 py-2.5 outline-none focus:border-blush focus:bg-white transition"
              >
                <option value="DINNER">저녁만</option>
                <option value="LUNCH">점심만</option>
                <option value="BOTH">점심·저녁 둘다</option>
              </select>
            </div>
          ) : (
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full rounded-lg border border-line bg-cream/40 px-3.5 py-2.5 outline-none focus:border-blush focus:bg-white transition"
            >
              {otherGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}

          {err && <p className="text-sm text-blush">{err}</p>}

          <button
            type="button"
            onClick={run}
            disabled={pending || picked.size === 0}
            className="w-full rounded-full bg-ink py-3 text-white font-medium disabled:opacity-40 hover:brightness-110 transition"
          >
            {pending
              ? "처리 중…"
              : mode === "new"
                ? `${picked.size}명 새 그룹으로 나누기`
                : `${picked.size}명 이동하기`}
          </button>
          <p className="text-xs text-ink-soft/60">
            개인 링크와 투표는 그대로 유지되고 소속만 바뀌어요.
          </p>
        </div>
      )}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1 text-xs transition disabled:opacity-40 ${
        active ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
