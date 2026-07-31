"use client";

import { useState } from "react";

// path("/vote/xxx") 를 받으면 클릭 시 origin 을 붙여 전체 URL 을 복사한다.
export function CopyButton({
  path,
  text,
  label = "링크 복사",
  className,
}: {
  path?: string;
  text?: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const value = text ?? (path ? `${window.location.origin}${path}` : "");
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // 클립보드 권한 없을 때 폴백
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={
        className ??
        "shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink-soft hover:border-blush hover:text-blush transition"
      }
    >
      {copied ? "복사됨 ✓" : label}
    </button>
  );
}
