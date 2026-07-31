"use client";

import { useState } from "react";

const TEMPLATES: Record<"friend" | "boss", string[]> = {
  friend: [
    "얘들아 나 결혼해! 청첩장 주면서 밥 한번 사고 싶은데 언제 좋아? 😊",
    "드디어 나도 국수 먹인다ㅎㅎ 청첩장도 줄 겸 얼굴 보고 밥 먹자!",
    "나 결혼한다!! 너희한테 직접 청첩장 주고 싶어서, 다 같이 밥 한 끼 하자 🍚",
    "결혼 소식 전하려고! 바쁘겠지만 잠깐 시간 내서 밥 먹으면서 청첩장 받아줘 💌",
    "우리 언제 한번 모이자~ 나 결혼하는데 청첩장 직접 주고 싶어! 편한 날 골라줘 🙌",
  ],
  boss: [
    "안녕하세요. 이번에 결혼하게 되어 청첩장을 직접 전해드리고자 합니다. 괜찮으신 날 편하게 골라주시면 감사하겠습니다.",
    "바쁘신 와중에 실례합니다. 결혼 소식 전해드리며, 식사 자리에 모시고 청첩장 드리고 싶습니다. 가능하신 날짜 알려주시면 맞추겠습니다.",
    "평소 감사한 마음을 전하고 싶어, 결혼 소식과 함께 식사 한 끼 대접하려 합니다. 편하신 시간을 표시해 주세요.",
    "결혼을 앞두고 인사드립니다. 청첩장을 직접 드리며 식사 자리를 마련하고 싶은데, 괜찮으신 날 골라주시면 감사하겠습니다.",
    "귀한 시간 내주시기 어려우시겠지만, 결혼 소식 전하며 식사 자리에 모시고 싶습니다. 가능하신 날짜 체크 부탁드립니다.",
  ],
};

const TABS: { key: "friend" | "boss"; label: string }[] = [
  { key: "friend", label: "친구용" },
  { key: "boss", label: "직장상사용" },
];

export function InviteMessageField() {
  const [tab, setTab] = useState<"friend" | "boss">("friend");
  const [value, setValue] = useState("");

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-ink-soft">
          초대 문구 <span className="text-ink-soft/60">(선택)</span>
        </span>
        {/* 카테고리 탭 */}
        <div className="flex gap-1 rounded-full bg-cream-deep/50 p-0.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                tab === t.key
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
