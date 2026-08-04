"use client";

import { useState } from "react";
import {
  INVITE_TABS as TABS,
  INVITE_TEMPLATES as TEMPLATES,
  type InviteCat,
} from "@/lib/invite-templates";

export function InviteMessageField() {
  const [tab, setTab] = useState<InviteCat>("friend");
  const [value, setValue] = useState("");

  return (
    <div>
      <span className="block text-sm text-ink-soft mb-2">
        초대 문구 <span className="text-ink-soft/60">(선택)</span>
      </span>

      {/* 카테고리 탭 (줄바꿈) */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {TABS.map((t) => (
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
        {TEMPLATES[tab].map((tpl, i) => {
          const active = value === tpl;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setValue(tpl)}
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
        name="inviteMsg"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="위 추천 문구를 누르면 채워져요. 직접 써도 됩니다."
        className="w-full rounded-lg border border-line bg-cream/40 px-3.5 py-2.5 outline-none focus:border-blush focus:bg-white transition resize-none"
      />
      <p className="text-xs text-ink-soft/60 mt-1">
        추천 문구를 누르면 채워지고, 그대로 쓰거나 고쳐도 돼요.
      </p>
    </div>
  );
}
