"use client";

import { useState, useTransition } from "react";
import { updateGroupInvite } from "@/lib/actions";
import {
  INVITE_TABS,
  INVITE_TEMPLATES,
  type InviteCat,
} from "@/lib/invite-templates";

export function InviteMessageEditor({
  hostToken,
  groupId,
  initial,
}: {
  hostToken: string;
  groupId: string;
  initial: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<InviteCat>("friend");
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      await updateGroupInvite(hostToken, groupId, value);
      setSaved(true);
      setOpen(false);
    });
  }

  return (
    <div className="mt-3">
      {/* 현재 문구 + 수정 토글 */}
      <div className="rounded-lg bg-cream-deep/40 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-ink-soft italic min-w-0">
            {value ? `“${value}”` : "인사 문구가 없어요"}
          </p>
          <button
            type="button"
            onClick={() => {
              setSaved(false);
              setOpen((o) => !o);
            }}
            className="shrink-0 text-xs text-blush hover:underline"
          >
            {open ? "닫기" : "수정"}
          </button>
        </div>
        {saved && !open && (
          <p className="text-xs text-sage mt-1">저장됐어요 ✓</p>
        )}
      </div>

      {open && (
        <div className="mt-2 card p-4">
          {/* 카테고리 탭 */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {INVITE_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-full px-3 py-1.5 text-xs border transition ${
                  tab === t.key
                    ? "bg-ink text-white border-ink"
                    : "bg-white text-ink-soft border-line hover:border-blush"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 추천 문구 칩 */}
          <div className="space-y-1.5 mb-2">
            {INVITE_TEMPLATES[tab].map((tpl, i) => {
              const active = value === tpl;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSaved(false);
                    setValue(tpl);
                  }}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-xs leading-relaxed transition ${
                    active
                      ? "border-blush bg-blush-soft/40 text-ink"
                      : "border-line bg-white text-ink-soft hover:border-blush"
                  }`}
                >
                  <span className="mr-1 text-blush">{active ? "✓" : "＋"}</span>
                  {tpl}
                </button>
              );
            })}
          </div>

          <textarea
            value={value}
            onChange={(e) => {
              setSaved(false);
              setValue(e.target.value);
            }}
            rows={3}
            placeholder="직접 써도 됩니다."
            className="w-full rounded-lg border border-line bg-cream/40 px-3.5 py-2.5 outline-none focus:border-blush focus:bg-white transition resize-none"
          />

          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="mt-3 w-full rounded-full bg-ink py-2.5 text-white font-medium disabled:opacity-40 hover:brightness-110 transition"
          >
            {pending ? "저장 중…" : "저장하기"}
          </button>
        </div>
      )}
    </div>
  );
}
