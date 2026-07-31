import { createEvent } from "@/lib/actions";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl px-5 py-10 sm:py-16">
      <header className="text-center mb-10">
        <p className="text-gold tracking-[0.3em] text-xs mb-3">CHEONGMO</p>
        <h1 className="font-serif-kr text-4xl sm:text-5xl font-extrabold text-ink leading-tight">
          청첩장 모임
          <br />
          날짜 잡기
        </h1>
        <p className="mt-4 text-ink-soft leading-relaxed">
          그룹별로 밥약 날짜를 투표받고,
          <br />
          신랑·신부 일정이 겹치지 않게 자동으로 잡아드려요.
        </p>
      </header>

      <form action={createEvent} className="card p-6 sm:p-8 space-y-5">
        <h2 className="font-serif-kr text-xl font-bold text-ink">우리 이야기</h2>

        <div className="grid grid-cols-2 gap-3">
          <Field label="신랑" name="groomName" placeholder="이름" required />
          <Field label="신부" name="brideName" placeholder="이름" required />
        </div>

        <Field label="결혼식 날짜" name="weddingDate" type="date" required />

        <div className="pt-2 border-t border-line">
          <p className="text-sm text-ink-soft mb-3">
            청첩장 모임을 잡을{" "}
            <span className="font-medium text-ink">후보 기간</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="시작" name="windowStart" type="date" required />
            <Field label="끝" name="windowEnd" type="date" required />
          </div>
        </div>

        <Field
          label="예식일 앞뒤로 비워둘 날 (버퍼)"
          name="bufferDays"
          type="number"
          defaultValue="3"
          hint="예: 3 이면 예식일 ±3일은 후보에서 자동 제외"
        />

        <button
          type="submit"
          className="w-full rounded-full bg-blush py-3.5 text-white font-medium shadow-sm hover:brightness-105 active:scale-[.99] transition"
        >
          시작하기
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-soft/80 leading-relaxed">
        만들면 <span className="text-ink">호스트 링크</span>가 나와요. 그 링크가
        관리자 페이지라 꼭 저장해두세요.
      </p>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-ink-soft mb-1.5">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-line bg-cream/40 px-3.5 py-2.5 text-ink outline-none focus:border-blush focus:bg-white transition"
      />
      {hint && (
        <span className="block text-xs text-ink-soft/70 mt-1">{hint}</span>
      )}
    </label>
  );
}
