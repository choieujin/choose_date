"use client";

import { useState, useTransition } from "react";
import { deleteGroup } from "@/lib/actions";

export function DeleteGroupButton({
  hostToken,
  groupId,
  groupName,
}: {
  hostToken: string;
  groupId: string;
  groupName: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-sm text-ink-soft/60 hover:text-blush transition"
      >
        이 그룹 삭제
      </button>
    );
  }

  return (
    <div className="card p-4 border-blush/40">
      <p className="text-sm text-ink mb-3">
        <b>{groupName}</b> 그룹을 삭제할까요? 멤버·투표·확정이 모두 사라지고
        되돌릴 수 없어요.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            start(async () => {
              await deleteGroup(hostToken, groupId);
            })
          }
          disabled={pending}
          className="flex-1 rounded-full bg-blush py-2.5 text-white text-sm font-medium disabled:opacity-40 hover:brightness-105 transition"
        >
          {pending ? "삭제 중…" : "네, 삭제할게요"}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          disabled={pending}
          className="flex-1 rounded-full border border-line py-2.5 text-sm text-ink-soft hover:border-ink-soft transition"
        >
          취소
        </button>
      </div>
    </div>
  );
}
