import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-20 text-center">
      <p className="text-gold tracking-[0.3em] text-xs mb-3">CHEONGMO</p>
      <h1 className="font-serif-kr text-2xl font-bold text-ink mb-2">
        링크를 찾을 수 없어요
      </h1>
      <p className="text-ink-soft text-sm mb-6">
        주소가 바뀌었거나 삭제된 링크일 수 있어요.
      </p>
      <Link
        href="/"
        className="inline-block rounded-full bg-blush px-6 py-2.5 text-white text-sm"
      >
        처음으로
      </Link>
    </main>
  );
}
