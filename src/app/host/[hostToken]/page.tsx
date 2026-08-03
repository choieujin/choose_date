import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createGroup } from "@/lib/actions";
import {
  SLOTTYPE_LABEL,
  SLOT_LABEL,
  buildCalendar,
  candidateDates,
  dateKey,
  formatDateLabel,
  toDateOnly,
} from "@/lib/domain";
import { CopyButton } from "@/components/CopyButton";
import { InviteMessageField } from "@/components/InviteMessageField";
import { BlockedDatesEditor } from "@/components/BlockedDatesEditor";

export default async function HostDashboard({
  params,
}: {
  params: Promise<{ hostToken: string }>;
}) {
  const { hostToken } = await params;

  const event = await prisma.event.findUnique({
    where: { hostToken },
    include: {
      groups: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { members: true } },
          members: {
            select: {
              id: true,
              submitted: true,
              _count: { select: { votes: true } },
            },
          },
          confirmation: true,
        },
      },
      blockedDates: true,
    },
  });

  if (!event) notFound();

  const candidates = candidateDates(
    event.windowStart,
    event.windowEnd,
    event.weddingDate,
    event.bufferDays,
  );
  const baseKeys = new Set(candidates.map((c) => c.key));
  const blockedKeys = event.blockedDates.map((b) => dateKey(b.date));
  const blockCalendar = buildCalendar(
    event.windowStart,
    event.windowEnd,
    baseKeys,
  );
  const candidateCount = baseKeys.size - blockedKeys.length;

  const confirmedCount = event.groups.filter((g) => g.confirmation).length;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8 sm:py-12">
      {/* 커플 배너 */}
      <header className="text-center mb-8">
        <p className="text-gold tracking-[0.3em] text-xs mb-2">HOST</p>
        <h1 className="font-serif-kr text-3xl sm:text-4xl font-extrabold text-ink">
          {event.groomName} <span className="text-blush">♥</span> {event.brideName}
        </h1>
        <p className="mt-2 text-ink-soft text-sm">
          {formatDateLabel(event.weddingDate)} 결혼합니다
        </p>
      </header>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="그룹" value={`${event.groups.length}`} />
        <Stat label="확정" value={`${confirmedCount}/${event.groups.length}`} />
        <Stat label="후보 날짜" value={`${candidateCount}일`} />
      </div>

      {/* 호스트 링크 안내 */}
      <div className="card p-4 mb-6 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-soft mb-0.5">이 페이지 링크 (관리자용)</p>
          <p className="truncate text-sm text-ink">/host/{hostToken}</p>
        </div>
        <CopyButton path={`/host/${hostToken}`} label="복사" />
      </div>

      {/* 개인 일정 잠금 */}
      <div className="mb-6">
        <BlockedDatesEditor
          hostToken={hostToken}
          months={blockCalendar}
          initial={blockedKeys}
        />
      </div>

      {/* 그룹 목록 */}
      <section className="space-y-3 mb-8">
        <h2 className="font-serif-kr text-xl font-bold text-ink">그룹</h2>
        {event.groups.length === 0 && (
          <p className="text-sm text-ink-soft py-4 text-center">
            아직 그룹이 없어요. 아래에서 만들어보세요.
          </p>
        )}
        {event.groups.map((g) => {
          const voted = g.members.filter(
            (m) => m.submitted || m._count.votes > 0,
          ).length;
          const total = g._count.members;
          const allDone = total > 0 && voted === total;
          const pct = total ? (voted / total) * 100 : 0;
          return (
            <Link
              key={g.id}
              href={`/host/${hostToken}/group/${g.id}`}
              className="card p-4 block hover:border-blush transition"
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-ink">{g.name}</span>
                    <span className="shrink-0 rounded-full bg-sage-soft text-sage px-2 py-0.5 text-[11px]">
                      {SLOTTYPE_LABEL[g.slotType]}
                    </span>
                    {allDone && !g.confirmation && (
                      <span className="shrink-0 rounded-full bg-sage text-white px-2 py-0.5 text-[11px]">
                        투표 완료 ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-soft mt-1">
                    투표 {voted}/{total}명
                  </p>
                </div>
                {g.confirmation ? (
                  <span className="shrink-0 rounded-full bg-blush text-white px-3 py-1 text-xs">
                    {formatDateLabel(toDateOnly(g.confirmation.date))}{" "}
                    {SLOT_LABEL[g.confirmation.slot]} 확정
                  </span>
                ) : (
                  <span className="shrink-0 text-ink-soft/60 text-xs">
                    미정 →
                  </span>
                )}
              </div>
              {!g.confirmation && total > 0 && (
                <div className="mt-2.5 h-1.5 rounded-full bg-cream-deep/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${allDone ? "bg-sage" : "bg-blush"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </section>

      {/* 그룹 추가 */}
      <section className="card p-5 sm:p-6">
        <h3 className="font-serif-kr text-lg font-bold text-ink mb-4">
          그룹 추가
        </h3>
        <form action={createGroup.bind(null, hostToken)} className="space-y-4">
          <label className="block">
            <span className="block text-sm text-ink-soft mb-1.5">
              그룹 이름
            </span>
            <input
              name="name"
              required
              placeholder="예: 대학 친구들"
              className="w-full rounded-lg border border-line bg-cream/40 px-3.5 py-2.5 outline-none focus:border-blush focus:bg-white transition"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-ink-soft mb-1.5">
              모임 시간대
            </span>
            <select
              name="slotType"
              defaultValue="DINNER"
              className="w-full rounded-lg border border-line bg-cream/40 px-3.5 py-2.5 outline-none focus:border-blush focus:bg-white transition"
            >
              <option value="DINNER">저녁만</option>
              <option value="LUNCH">점심만</option>
              <option value="BOTH">점심·저녁 둘다 (멤버가 선택)</option>
            </select>
          </label>

          <InviteMessageField />

          <button
            type="submit"
            className="w-full rounded-full bg-ink py-3 text-white font-medium hover:brightness-110 active:scale-[.99] transition"
          >
            그룹 만들기
          </button>
        </form>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="font-serif-kr text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-soft mt-0.5">{label}</p>
    </div>
  );
}
