"use client";

import { useState, useTransition } from "react";
import { addMembers, deleteMember } from "@/lib/actions";
import { CopyButton } from "./CopyButton";

export interface MemberRow {
  id: string;
  name: string;
  token: string;
  voted: boolean;
}

export function MembersManager({
  hostToken,
  groupId,
  members,
}: {
  hostToken: string;
  groupId: string;
  members: MemberRow[];
}) {
  const [names, setNames] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onAdd() {
    setErr(null);
    start(async () => {
      const res = await addMembers(hostToken, groupId, names);
      if (res?.ok) setNames("");
      else setErr(res?.error ?? "실패했어요.");
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
          {members.map((m) => (
            <li
              key={m.id}
              className="card p-3 flex items-center gap-2"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  m.voted ? "bg-sage" : "bg-line"
                }`}
                title={m.voted ? "투표함" : "아직 안 함"}
              />
              <span className="font-medium text-ink truncate flex-1">
                {m.name}
              </span>
              <span className="text-xs text-ink-soft/70 shrink-0">
                {m.voted ? "투표함" : "대기"}
              </span>
              <CopyButton path={`/vote/${m.token}`} label="링크" />
              <DeleteMember
                hostToken={hostToken}
                groupId={groupId}
                memberId={m.id}
              />
            </li>
          ))}
        </ul>
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
