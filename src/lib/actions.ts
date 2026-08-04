"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Prisma,
  type Slot,
  type SlotPref,
  type SlotType,
  type VoteStatus,
} from "@prisma/client";
import { prisma } from "./prisma";
import {
  dateKey,
  eventCandidateKeys,
  groupEffectiveKeys,
  slotsFor,
  toDateOnly,
} from "./domain";

// ---------- 이벤트 생성 ----------
export async function createEvent(formData: FormData) {
  const groomName = String(formData.get("groomName") ?? "").trim();
  const brideName = String(formData.get("brideName") ?? "").trim();
  const weddingDate = String(formData.get("weddingDate") ?? "");
  const windowStart = String(formData.get("windowStart") ?? "");
  const windowEnd = String(formData.get("windowEnd") ?? "");
  const bufferDays = Number(formData.get("bufferDays") ?? 0);

  if (!groomName || !brideName || !weddingDate || !windowStart || !windowEnd) {
    throw new Error("필수 항목이 비어 있어요.");
  }

  const event = await prisma.event.create({
    data: {
      groomName,
      brideName,
      weddingDate: toDateOnly(weddingDate),
      windowStart: toDateOnly(windowStart),
      windowEnd: toDateOnly(windowEnd),
      bufferDays: Number.isFinite(bufferDays) ? bufferDays : 0,
    },
  });

  redirect(`/host/${event.hostToken}`);
}

// ---------- 그룹 생성 ----------
export async function createGroup(hostToken: string, formData: FormData) {
  const event = await prisma.event.findUnique({ where: { hostToken } });
  if (!event) throw new Error("이벤트를 찾을 수 없어요.");

  const name = String(formData.get("name") ?? "").trim();
  const slotType = String(formData.get("slotType") ?? "DINNER") as SlotType;
  const inviteMsg = String(formData.get("inviteMsg") ?? "").trim() || null;

  if (!name) throw new Error("그룹 이름을 적어주세요.");

  await prisma.group.create({
    data: { eventId: event.id, name, slotType, inviteMsg },
  });

  revalidatePath(`/host/${hostToken}`);
}

// ---------- 멤버(이름) 추가 → 개인 링크 생성 ----------
export async function addMembers(hostToken: string, groupId: string, namesRaw: string) {
  const group = await assertGroupOwnedBy(hostToken, groupId);

  const names = namesRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (names.length === 0) return { ok: false, error: "이름을 하나 이상 적어주세요." };

  await prisma.member.createMany({
    data: names.map((name) => ({ groupId: group.id, name })),
  });

  revalidatePath(`/host/${hostToken}/group/${groupId}`);
  return { ok: true };
}

export async function deleteMember(hostToken: string, groupId: string, memberId: string) {
  await assertGroupOwnedBy(hostToken, groupId);
  await prisma.member.delete({ where: { id: memberId } });
  revalidatePath(`/host/${hostToken}/group/${groupId}`);
  return { ok: true };
}

export async function deleteGroup(hostToken: string, groupId: string) {
  await assertGroupOwnedBy(hostToken, groupId);
  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath(`/host/${hostToken}`);
  redirect(`/host/${hostToken}`);
}

// ---------- 그룹 나누기: 선택 멤버를 새 그룹으로 ----------
export async function splitGroupToNew(
  hostToken: string,
  sourceGroupId: string,
  memberIds: string[],
  name: string,
  slotType: SlotType,
  inviteMsg?: string | null,
) {
  const source = await assertGroupOwnedBy(hostToken, sourceGroupId);
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "새 그룹 이름을 적어주세요." };
  if (memberIds.length === 0)
    return { ok: false, error: "나눌 멤버를 선택해주세요." };

  const created = await prisma.group.create({
    data: {
      eventId: source.eventId,
      name: trimmed,
      slotType,
      inviteMsg: inviteMsg?.trim() || null,
    },
  });

  // 소속만 변경 (개인 링크·투표는 그대로 유지). 실제 소스 소속 멤버만 이동.
  await prisma.member.updateMany({
    where: { id: { in: memberIds }, groupId: source.id },
    data: { groupId: created.id },
  });

  revalidatePath(`/host/${hostToken}`, "layout");
  redirect(`/host/${hostToken}/group/${created.id}`);
}

// ---------- 선택 멤버를 기존 다른 그룹으로 이동 ----------
export async function moveMembersToGroup(
  hostToken: string,
  sourceGroupId: string,
  memberIds: string[],
  targetGroupId: string,
) {
  const source = await assertGroupOwnedBy(hostToken, sourceGroupId);
  const target = await assertGroupOwnedBy(hostToken, targetGroupId);
  if (source.eventId !== target.eventId)
    return { ok: false, error: "같은 이벤트의 그룹만 이동할 수 있어요." };
  if (memberIds.length === 0)
    return { ok: false, error: "이동할 멤버를 선택해주세요." };

  await prisma.member.updateMany({
    where: { id: { in: memberIds }, groupId: source.id },
    data: { groupId: target.id },
  });

  revalidatePath(`/host/${hostToken}`, "layout");
  return { ok: true };
}

// ---------- 투표 제출 (멤버 토큰) — 날짜 단위 ----------
export interface DateVoteInput {
  date: string; // YYYY-MM-DD
  status: VoteStatus;
}

export async function submitVotes(
  memberToken: string,
  votes: DateVoteInput[],
  slotPref: SlotPref | null,
) {
  const member = await prisma.member.findUnique({
    where: { token: memberToken },
    include: {
      group: {
        include: {
          event: { include: { blockedDates: true } },
          allowedDates: true,
        },
      },
    },
  });
  if (!member) return { ok: false, error: "링크가 올바르지 않아요." };

  // 이 그룹이 실제로 고를 수 있는 날짜(기간-버퍼-개인잠금 ∩ 그룹허용) 밖은 무시
  const evt = member.group.event;
  const blockedKeys = new Set(evt.blockedDates.map((b) => dateKey(b.date)));
  const eventKeys = eventCandidateKeys(
    evt.windowStart,
    evt.windowEnd,
    evt.weddingDate,
    evt.bufferDays,
    blockedKeys,
  );
  const groupKeys = groupEffectiveKeys(
    eventKeys,
    member.group.allowedDates.map((d) => dateKey(d.date)),
  );

  // 그룹의 모든 슬롯이 다른 그룹에 의해 확정된 날짜 = 완전 잠금 → 투표 무시
  const groupSlots = slotsFor(member.group.slotType);
  const others = await prisma.confirmation.findMany({
    where: { eventId: member.group.eventId, groupId: { not: member.groupId } },
    select: { date: true, slot: true },
  });
  const takenByDate = new Map<string, Set<Slot>>();
  for (const c of others) {
    const k = dateKey(c.date);
    (takenByDate.get(k) ?? takenByDate.set(k, new Set()).get(k)!).add(c.slot);
  }
  const fullyLocked = (dk: string) => {
    const taken = takenByDate.get(dk);
    return !!taken && groupSlots.every((s) => taken.has(s));
  };

  const clean = votes.filter(
    (v) => groupKeys.has(v.date) && !fullyLocked(v.date),
  );

  await prisma.$transaction([
    ...clean.map((v) =>
      prisma.vote.upsert({
        where: {
          memberId_date: { memberId: member.id, date: toDateOnly(v.date) },
        },
        create: {
          memberId: member.id,
          date: toDateOnly(v.date),
          status: v.status,
        },
        update: { status: v.status },
      }),
    ),
    prisma.member.update({
      where: { id: member.id },
      data: {
        submitted: true,
        slotPref: member.group.slotType === "BOTH" ? slotPref : null,
      },
    }),
  ]);

  revalidatePath(`/vote/${memberToken}`);
  return { ok: true };
}

// ---------- 슬롯 확정 (★ 전역 잠금) ----------
export async function confirmSlot(
  hostToken: string,
  groupId: string,
  date: string,
  slot: Slot,
) {
  const group = await assertGroupOwnedBy(hostToken, groupId);

  try {
    await prisma.confirmation.upsert({
      // 그룹당 확정 1개 → groupId 기준 upsert (재확정 시 날짜 변경)
      where: { groupId: group.id },
      create: {
        eventId: group.eventId,
        groupId: group.id,
        date: toDateOnly(date),
        slot,
      },
      update: { date: toDateOnly(date), slot },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // (eventId, date, slot) 유니크 위반 = 다른 그룹이 이미 잡은 슬롯
      return { ok: false, error: "이미 다른 그룹이 잡은 날/시간이에요." };
    }
    throw e;
  }

  revalidatePath(`/host/${hostToken}`);
  revalidatePath(`/host/${hostToken}/group/${groupId}`);
  return { ok: true };
}

export async function unconfirm(hostToken: string, groupId: string) {
  const group = await assertGroupOwnedBy(hostToken, groupId);
  await prisma.confirmation.deleteMany({ where: { groupId: group.id } });
  revalidatePath(`/host/${hostToken}`);
  revalidatePath(`/host/${hostToken}/group/${groupId}`);
  return { ok: true };
}

// ---------- 호스트 개인 일정(잠금 날짜) 저장 ----------
export async function setBlockedDates(hostToken: string, dateKeys: string[]) {
  const event = await prisma.event.findUnique({ where: { hostToken } });
  if (!event) return { ok: false, error: "이벤트를 찾을 수 없어요." };

  const unique = [...new Set(dateKeys)];
  await prisma.$transaction([
    prisma.blockedDate.deleteMany({ where: { eventId: event.id } }),
    ...(unique.length
      ? [
          prisma.blockedDate.createMany({
            data: unique.map((d) => ({ eventId: event.id, date: toDateOnly(d) })),
          }),
        ]
      : []),
  ]);

  revalidatePath(`/host/${hostToken}`, "layout");
  return { ok: true };
}

// ---------- 그룹별 선택가능 날짜 저장 (빈 배열 = 전체 허용) ----------
export async function setGroupDates(
  hostToken: string,
  groupId: string,
  dateKeys: string[],
) {
  const group = await assertGroupOwnedBy(hostToken, groupId);

  const unique = [...new Set(dateKeys)];
  await prisma.$transaction([
    prisma.groupDate.deleteMany({ where: { groupId: group.id } }),
    ...(unique.length
      ? [
          prisma.groupDate.createMany({
            data: unique.map((d) => ({ groupId: group.id, date: toDateOnly(d) })),
          }),
        ]
      : []),
  ]);

  revalidatePath(`/host/${hostToken}`, "layout");
  return { ok: true };
}

// ---------- 헬퍼 ----------
async function assertGroupOwnedBy(hostToken: string, groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { event: true },
  });
  if (!group || group.event.hostToken !== hostToken) {
    throw new Error("권한이 없어요.");
  }
  return group;
}
