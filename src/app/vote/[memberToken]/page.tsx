import { notFound } from "next/navigation";
import type { Slot, VoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SLOT_LABEL,
  buildCalendar,
  dateKey,
  formatDateLabel,
  slotsFor,
  toDateOnly,
} from "@/lib/domain";
import { VoteCalendar } from "@/components/VoteCalendar";

export default async function VotePage({
  params,
}: {
  params: Promise<{ memberToken: string }>;
}) {
  const { memberToken } = await params;

  const member = await prisma.member.findUnique({
    where: { token: memberToken },
    include: {
      votes: true,
      group: { include: { event: true, confirmation: true } },
    },
  });

  if (!member) notFound();
  const { group } = member;
  const event = group.event;

  const coupleLine = (
    <p className="text-ink-soft text-sm">
      {event.groomName} <span className="text-blush">♥</span> {event.brideName} ·{" "}
      {formatDateLabel(event.weddingDate)} 결혼합니다
    </p>
  );

  // 이미 우리 그룹 날짜가 확정된 경우 → 안내 화면
  if (group.confirmation) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-12 text-center">
        <p className="text-gold tracking-[0.3em] text-xs mb-3">CHEONGMO</p>
        <h1 className="font-serif-kr text-2xl font-bold text-ink mb-2">
          {member.name}님, 날짜가 정해졌어요 🎉
        </h1>
        {coupleLine}
        <div className="card p-6 mt-6">
          <p className="text-ink-soft text-sm mb-1">{group.name} 모임</p>
          <p className="font-serif-kr text-3xl font-extrabold text-blush">
            {formatDateLabel(toDateOnly(group.confirmation.date))}
          </p>
          <p className="text-ink mt-1">
            {SLOT_LABEL[group.confirmation.slot]}에 만나요
          </p>
        </div>
        <p className="text-xs text-ink-soft/70 mt-6">
          자세한 장소·시간은 따로 알려드릴게요!
        </p>
      </main>
    );
  }

  // 그룹의 모든 슬롯이 다른 그룹에 잡힌 날짜 = 완전 잠금
  const groupSlots = slotsFor(group.slotType);
  const others = await prisma.confirmation.findMany({
    where: { eventId: event.id, groupId: { not: group.id } },
    include: { group: { select: { name: true } } },
  });
  const takenByDate = new Map<string, { slots: Set<Slot>; name: string }>();
  for (const c of others) {
    const k = dateKey(c.date);
    const e = takenByDate.get(k) ?? { slots: new Set<Slot>(), name: c.group.name };
    e.slots.add(c.slot);
    takenByDate.set(k, e);
  }
  const lockedDates: Record<string, string> = {};
  for (const [k, v] of takenByDate) {
    if (groupSlots.every((s) => v.slots.has(s))) lockedDates[k] = v.name;
  }

  const months = buildCalendar(
    event.windowStart,
    event.windowEnd,
    event.weddingDate,
    event.bufferDays,
  );

  const initial: Record<string, VoteStatus> = {};
  for (const v of member.votes) initial[dateKey(v.date)] = v.status;

  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <header className="text-center mb-8">
        <p className="text-gold tracking-[0.3em] text-xs mb-3">CHEONGMO</p>
        <h1 className="font-serif-kr text-3xl font-extrabold text-ink">
          안녕하세요
          <br />
          {member.name}님 🎉
        </h1>
        <div className="mt-3">{coupleLine}</div>
        {group.inviteMsg && (
          <p className="mt-5 rounded-2xl bg-white border border-line px-5 py-4 text-ink leading-relaxed">
            {group.inviteMsg}
          </p>
        )}
        <p className="mt-5 text-sm text-ink-soft">
          가능한 날짜를 달력에서 눌러주세요.
          {group.slotType !== "BOTH" && (
            <>
              {" "}
              <b className="text-sage">{SLOT_LABEL[groupSlots[0]]} 모임</b>이에요.
            </>
          )}
        </p>
      </header>

      {months.length === 0 ? (
        <p className="text-center text-sm text-ink-soft">
          아직 후보 날짜가 준비되지 않았어요.
        </p>
      ) : (
        <VoteCalendar
          memberToken={memberToken}
          months={months}
          initial={initial}
          lockedDates={lockedDates}
          showSlotPref={group.slotType === "BOTH"}
          initialPref={member.slotPref}
        />
      )}
    </main>
  );
}
