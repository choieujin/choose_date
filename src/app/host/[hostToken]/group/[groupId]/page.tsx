import Link from "next/link";
import { notFound } from "next/navigation";
import type { Slot } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SLOTPREF_LABEL,
  SLOTTYPE_LABEL,
  buildCalendar,
  dateKey,
  eventCandidateKeys,
  formatDateLabel,
  groupEffectiveKeys,
  slotsFor,
  toDateOnly,
} from "@/lib/domain";
import { MembersManager } from "@/components/MembersManager";
import { ConfirmGrid, type ConfirmRow } from "@/components/ConfirmGrid";
import { GroupDatesEditor } from "@/components/GroupDatesEditor";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ hostToken: string; groupId: string }>;
}) {
  const { hostToken, groupId } = await params;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      event: { include: { blockedDates: true } },
      confirmation: true,
      allowedDates: true,
      members: {
        orderBy: { createdAt: "asc" },
        include: { votes: true },
      },
    },
  });

  if (!group || group.event.hostToken !== hostToken) notFound();
  const event = group.event;
  const groupSlots = slotsFor(group.slotType);
  const isBoth = group.slotType === "BOTH";

  // 후보 날짜: 이벤트 전체(기간-버퍼-개인잠금) → 그룹 허용목록 교집합
  const blockedKeys = new Set(event.blockedDates.map((b) => dateKey(b.date)));
  const eventKeys = eventCandidateKeys(
    event.windowStart,
    event.windowEnd,
    event.weddingDate,
    event.bufferDays,
    blockedKeys,
  );
  const allowedList = group.allowedDates.map((d) => dateKey(d.date));
  const groupKeys = groupEffectiveKeys(eventKeys, allowedList);
  // 그룹 허용 날짜 에디터용 달력 (이벤트에서 고를 수 있는 날짜만 표시)
  const groupDateCalendar = buildCalendar(
    event.windowStart,
    event.windowEnd,
    eventKeys,
  );

  // 다른 그룹이 잡은 슬롯 (날짜별)
  const others = await prisma.confirmation.findMany({
    where: { eventId: event.id, groupId: { not: group.id } },
    include: { group: { select: { name: true } } },
  });
  const takenByDate = new Map<string, Map<Slot, string>>();
  for (const c of others) {
    const k = dateKey(c.date);
    const inner = takenByDate.get(k) ?? new Map<Slot, string>();
    inner.set(c.slot, c.group.name);
    takenByDate.set(k, inner);
  }

  // 날짜별 집계
  const tally = new Map<string, { yes: number; maybe: number }>();
  for (const m of group.members) {
    for (const v of m.votes) {
      const k = dateKey(v.date);
      const t = tally.get(k) ?? { yes: 0, maybe: 0 };
      if (v.status === "YES") t.yes++;
      else if (v.status === "MAYBE") t.maybe++;
      tally.set(k, t);
    }
  }

  const candKeys = groupKeys;

  const confirmedKey = group.confirmation
    ? dateKey(group.confirmation.date)
    : null;

  // 확정 후보 행: 표를 받았거나 이미 확정된 날짜
  const maxYes = Math.max(0, ...[...tally.values()].map((t) => t.yes));
  const rows: ConfirmRow[] = [];
  for (const key of new Set([...tally.keys(), ...(confirmedKey ? [confirmedKey] : [])])) {
    if (!candKeys.has(key)) continue;
    const t = tally.get(key) ?? { yes: 0, maybe: 0 };
    const taken = takenByDate.get(key) ?? new Map<Slot, string>();
    const freeSlots = groupSlots.filter((s) => !taken.has(s));
    const lockedSlots = groupSlots
      .filter((s) => taken.has(s))
      .map((s) => ({ slot: s, name: taken.get(s)! }));
    const d = toDateOnly(key);
    rows.push({
      key,
      label: formatDateLabel(d),
      isWeekend: d.getUTCDay() === 0 || d.getUTCDay() === 6,
      yes: t.yes,
      maybe: t.maybe,
      freeSlots,
      lockedSlots,
      isBest: maxYes > 0 && t.yes === maxYes,
    });
  }
  rows.sort(
    (a, b) => b.yes - a.yes || b.maybe - a.maybe || a.key.localeCompare(b.key),
  );

  const current = group.confirmation
    ? { date: dateKey(group.confirmation.date), slot: group.confirmation.slot }
    : null;

  // 선호도 요약 (BOTH)
  const pref = { LUNCH: 0, DINNER: 0, EITHER: 0 };
  for (const m of group.members) if (m.slotPref) pref[m.slotPref]++;

  const memberRows = group.members.map((m) => ({
    id: m.id,
    name: m.name,
    token: m.token,
    voted: m.submitted || m.votes.length > 0,
  }));
  const submittedCount = memberRows.filter((m) => m.voted).length;
  const total = memberRows.length;
  const allDone = total > 0 && submittedCount === total;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8 sm:py-12">
      <Link
        href={`/host/${hostToken}`}
        className="text-sm text-ink-soft hover:text-blush transition"
      >
        ← 대시보드
      </Link>

      <header className="mt-4 mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-serif-kr text-3xl font-extrabold text-ink">
            {group.name}
          </h1>
          <span className="rounded-full bg-sage-soft text-sage px-2.5 py-0.5 text-xs">
            {SLOTTYPE_LABEL[group.slotType]}
          </span>
        </div>
        {group.inviteMsg && (
          <p className="mt-3 rounded-lg bg-cream-deep/40 px-4 py-3 text-sm text-ink-soft italic">
            “{group.inviteMsg}”
          </p>
        )}

        {/* 진행률 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-ink-soft">
              투표 {submittedCount}/{total}명
            </span>
            {allDone ? (
              <span className="text-sage font-medium">다 모였어요 ✓</span>
            ) : (
              <span className="text-ink-soft/60">
                {total - submittedCount}명 남음
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-cream-deep/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                allDone ? "bg-sage" : "bg-blush"
              }`}
              style={{
                width: `${total ? (submittedCount / total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </header>

      {/* 그룹별 선택가능 날짜 */}
      <GroupDatesEditor
        hostToken={hostToken}
        groupId={group.id}
        months={groupDateCalendar}
        initial={allowedList}
      />

      {/* 멤버 & 링크 */}
      <section className="mb-10">
        <h2 className="font-serif-kr text-xl font-bold text-ink mb-3">
          멤버 · 개인 링크
        </h2>
        <MembersManager
          hostToken={hostToken}
          groupId={group.id}
          members={memberRows}
        />
      </section>

      {/* 집계 & 확정 */}
      <section>
        <h2 className="font-serif-kr text-xl font-bold text-ink mb-3">
          집계 · 날짜 확정
        </h2>

        {isBoth && submittedCount > 0 && (
          <div className="card p-3 mb-3 flex items-center gap-3 text-sm">
            <span className="text-ink-soft">시간대 선호</span>
            <span className="flex gap-3">
              <span>점심 {pref.LUNCH}</span>
              <span>저녁 {pref.DINNER}</span>
              <span className="text-ink-soft/70">
                {SLOTPREF_LABEL.EITHER} {pref.EITHER}
              </span>
            </span>
          </div>
        )}

        <ConfirmGrid
          hostToken={hostToken}
          groupId={group.id}
          rows={rows}
          current={current}
        />
      </section>
    </main>
  );
}
