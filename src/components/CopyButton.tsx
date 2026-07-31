"use client";

import { useEffect, useRef, useState } from "react";

// 링크 복사/공유 버튼.
// 1) 모바일: 공유 시트(카톡 등으로 바로 보내기)
// 2) 데스크톱: 클립보드 복사
// 3) 둘 다 막히면: 주소를 그 자리에 펼쳐서 직접 복사(길게 눌러 선택)
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
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "manual">(
    "idle",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const getUrl = () =>
    text ?? (path ? `${window.location.origin}${path}` : "");

  useEffect(() => {
    if (status === "manual" && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [status]);

  // 클립보드 복사 시도 (writeText 가 멈추는 브라우저 대비 타임아웃 가드)
  function tryCopy(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        resolve(ok);
      };
      const timer = setTimeout(() => finish(false), 1200);

      const execFallback = () => {
        try {
          const ta = document.createElement("textarea");
          ta.value = url;
          ta.style.position = "fixed";
          ta.style.top = "-9999px";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          const ok = document.execCommand("copy");
          document.body.removeChild(ta);
          clearTimeout(timer);
          finish(ok);
        } catch {
          clearTimeout(timer);
          finish(false);
        }
      };

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).then(
          () => {
            clearTimeout(timer);
            finish(true);
          },
          () => execFallback(),
        );
      } else {
        execFallback();
      }
    });
  }

  async function onClick() {
    const url = getUrl();
    const isMobile =
      typeof navigator !== "undefined" &&
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // 1) 모바일 공유 시트 (카톡 등으로 바로 보내기)
    if (isMobile && typeof navigator.share === "function") {
      try {
        await navigator.share({ url });
        setStatus("shared");
        setTimeout(() => setStatus("idle"), 1500);
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // 사용자가 닫음
        // 그 외에는 아래 복사로 폴백
      }
    }

    // 2) 클립보드 복사
    const ok = await tryCopy(url);
    if (ok) {
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }

    // 3) 실패하면 주소를 펼쳐서 직접 복사
    setStatus("manual");
  }

  if (status === "manual") {
    return (
      <input
        ref={inputRef}
        readOnly
        value={getUrl()}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="링크 주소 (길게 눌러 복사하세요)"
        className="min-w-0 flex-1 rounded-md border border-blush bg-white px-2 py-1 text-xs text-ink"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        className ??
        "shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink-soft hover:border-blush hover:text-blush transition"
      }
    >
      {status === "copied" ? "복사됨 ✓" : status === "shared" ? "보냄 ✓" : label}
    </button>
  );
}
