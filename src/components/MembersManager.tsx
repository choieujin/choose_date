"use client";

import { useState, useTransition } from "react";
import type { SlotPref, VoteStatus } from "@prisma/client";
import { addMembers, deleteMember } from "@/lib/actions";
import { SLOTPREF_LABEL, formatDateLabel, toDateOnly } from "@/lib/domain";
import { CopyButton } from "./CopyButton";

export interface MemberRow {
  id: string;
  name: string;
  token: string;
  voted: boolean;
  slotPref: SlotPref | null;
  votes: { key: string; status: VoteStatus }[];
}

export function MembersManager({
  hostToken,
  groupId,
  members,
  isBoth,
}: {
  hostToken: string;
  groupId: string;
  members: MemberRow[];
  isBoth: boolean;
}) {
  const [names, setNames] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  function onAdd() {
    setErr(null);
    start(async () => {
      const res = await addMembers(hostToken, groupId, names);
      if (res?.ok) setNames("");
      else setErr(res?.error ?? "실패했어요.");
    });
  }

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* 추가 */}
      <div className="card p-4 space-y-3">
        <p className="text-sm text-ink-soft">
          이름을 적으면 <span className="text-ink font-medium">사람마다 개인 링크</span>가
          생겨요. 줄바꿈이나 쉼표로 여러 명 한 번에.
        </p>
        <textarea
          value={names}
          onChange={(e) => setNames(e.target.value)}
          rows={3}
          placeholder={"민지\n현우\n지수"}
          className="w-full rounded-lg border border-line bg-cream/40 px-3.5 py-2.5 outline-none focus:border-blush focus:bg-white transition resize-none"
        />
        {err && <p className="text-sm text-blush">{err}</p>}
        <button
          type="button"
          onClick={onAdd}
          disabled={pending || !names.trim()}
          className="rounded-full bg-ink px-5 py-2.5 text-white text-sm font-medium disabled:opacity-40 hover:brightness-110 transition"
        >
          {pending ? "추가 중…" : "멤버 추가"}
        </button>
      </div>

      {/* 목록 */}
      {members.length > 0 && (
        <ul className="space-y-2">
          {members.map((m) => {
            const expanded = open.has(m.id);
            return (
              <li key={m.id} className="card p-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      m.voted ? "bg-sage" : "bg-line"
                    }`}
                    title={m.voted ? "투표함" : "아직 안 함"}
                  />
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    className="flex-1 min-w-0 text-left flex items-center gap-1.5"
                  >
                    <span className="font-medium text-ink truncate">
                      {m.name}
                    </span>
                    <span className="text-xs text-ink-soft/60 shrink-0">
                      {expanded ? "▲" : "▼"}
                    </span>
                  </button>
                  <span className="text-xs text-ink-soft/70 shrink-0">
                    {m.voted ? "투표함" : "대기"}
                  </span>
                  <CopyButton path={`/vote/${m.token}`} label="링크" />
                  <DeleteMember
                    hostToken={hostToken}
                    groupId={groupId}
                    memberId={m.id}
                  />
                </div>

                {expanded && (
                  <VoteDetail votes={m.votes} slotPref={m.slotPref} isBoth={isBoth} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function VoteDetail({
  votes,
  slotPref,
  isBoth,
}: {
  votes: { key: string; status: VoteStatus }[];
  slotPref: SlotPref | null;
  isBoth: boolean;
}) {
  if (votes.length === 0) {
    return (
      <p className="mt-2 pt-2 border-t border-line text-sm text-ink-soft/70">
        아직 투표하지 않았어요.
      </p>
    );
  }

  const fmt = (keys: string[]) =>
    keys.map((k) => formatDateLabel(toDateOnly(k))).join(", ");
  const yes = votes.filter((v) => v.status === "YES").map((v) => v.key);
  const maybe = votes.filter((v) => v.status === "MAYBE").map((v) => v.key);
  const no = votes.filter((v) => v.status === "NO").map((v) => v.key);

  return (
    <div className="mt-2 pt-2 border-t border-line space-y-1.5 text-sm">
      {isBoth && slotPref && (
        <p className="text-ink-soft">
          시간대 선호 <span className="text-ink font-medium">{SLOTPREF_LABEL[slotPref]}</span>
        </p>
      )}
      {yes.length > 0 && (
        <p>
          <span className="text-sage font-medium">가능 {yes.length}</span>{" "}
          <span className="text-ink-soft">{fmt(yes)}</span>
        </p>
      )}
      {maybe.length > 0 && (
        <p>
          <span className="text-gold font-medium">애매 {maybe.length}</span>{" "}
          <span className="text-ink-soft">{fmt(maybe)}</span>
        </p>
      )}
      {no.length > 0 && (
        <p>
          <span className="text-ink-soft/70 font-medium">불가 {no.length}</span>{" "}
          <span className="text-ink-soft/50">{fmt(no)}</span>
        </p>
      )}
    </div>
  );
}

function DeleteMember({
  hostToken,
  groupId,
  memberId,
}: {
  hostToken: string;
  groupId: string;
  memberId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label="삭제"
      onClick={() =>
        start(async () => {
          await deleteMember(hostToken, groupId, memberId);
        })
      }
      disabled={pending}
      className="shrink-0 rounded-full px-2 py-1.5 text-xs text-ink-soft/50 hover:text-blush transition disabled:opacity-40"
    >
      ✕
    </button>
  );
}
