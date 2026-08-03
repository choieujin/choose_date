import type { Slot, SlotPref, SlotType, VoteStatus } from "@prisma/client";

// ---- 라벨 ----
export const SLOT_LABEL: Record<Slot, string> = {
  LUNCH: "점심",
  DINNER: "저녁",
};

export const SLOTPREF_LABEL: Record<SlotPref, string> = {
  LUNCH: "점심",
  DINNER: "저녁",
  EITHER: "둘다 좋아요",
};

export const SLOTTYPE_LABEL: Record<SlotType, string> = {
  LUNCH: "점심만",
  DINNER: "저녁만",
  BOTH: "점심·저녁 둘다",
};

export const STATUS_LABEL: Record<VoteStatus, string> = {
  YES: "가능",
  MAYBE: "애매",
  NO: "불가",
};

// SlotType 이 실제로 포함하는 Slot 목록
export function slotsFor(slotType: SlotType): Slot[] {
  if (slotType === "LUNCH") return ["LUNCH"];
  if (slotType === "DINNER") return ["DINNER"];
  return ["LUNCH", "DINNER"];
}

// ---- 날짜 유틸 (자정 UTC 기준으로 날짜만 다룬다) ----

// "YYYY-MM-DD" 문자열 <-> Date(자정 UTC)
export function toDateOnly(input: string | Date): Date {
  const s = typeof input === "string" ? input : input.toISOString().slice(0, 10);
  return new Date(`${s}T00:00:00.000Z`);
}

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

export interface CandidateDate {
  key: string; // YYYY-MM-DD
  date: Date;
  weekday: number; // 0=일 ... 6=토
  label: string; // "10.12 (토)"
  isWeekend: boolean;
}

const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDateLabel(d: Date): string {
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const wd = WEEKDAY_KR[d.getUTCDay()];
  return `${m}.${day} (${wd})`;
}

// 후보 기간 안의 날짜들 생성 (예식일 ± bufferDays 는 제외)
export function candidateDates(
  windowStart: Date,
  windowEnd: Date,
  weddingDate: Date,
  bufferDays: number,
): CandidateDate[] {
  const out: CandidateDate[] = [];
  const blockedFrom = addDays(weddingDate, -bufferDays);
  const blockedTo = addDays(weddingDate, bufferDays);

  let cur = toDateOnly(windowStart);
  const end = toDateOnly(windowEnd);
  let guard = 0;
  while (cur.getTime() <= end.getTime() && guard < 400) {
    guard++;
    const t = cur.getTime();
    const blocked = t >= blockedFrom.getTime() && t <= blockedTo.getTime();
    if (!blocked) {
      const weekday = cur.getUTCDay();
      out.push({
        key: dateKey(cur),
        date: new Date(cur),
        weekday,
        label: formatDateLabel(cur),
        isWeekend: weekday === 0 || weekday === 6,
      });
    }
    cur = addDays(cur, 1);
  }
  return out;
}

// slot 셀의 고유 키 (프론트 상태 관리용)
export function cellKey(dateKeyStr: string, slot: Slot): string {
  return `${dateKeyStr}__${slot}`;
}

// 이벤트 전체 후보 날짜 키 (기간 - 버퍼 - 호스트 개인 잠금)
export function eventCandidateKeys(
  windowStart: Date,
  windowEnd: Date,
  weddingDate: Date,
  bufferDays: number,
  blockedKeys: Set<string>,
): Set<string> {
  const out = new Set<string>();
  for (const c of candidateDates(windowStart, windowEnd, weddingDate, bufferDays)) {
    if (!blockedKeys.has(c.key)) out.add(c.key);
  }
  return out;
}

// 그룹이 실제로 고를 수 있는 날짜 키.
// allowedList 가 비어있으면 이벤트 후보 전체, 아니면 교집합.
export function groupEffectiveKeys(
  eventKeys: Set<string>,
  allowedList: string[],
): Set<string> {
  if (allowedList.length === 0) return eventKeys;
  const allow = new Set(allowedList);
  const out = new Set<string>();
  for (const k of eventKeys) if (allow.has(k)) out.add(k);
  return out;
}

// ---- 달력(월별 그리드) ----
export interface DayCell {
  key: string; // YYYY-MM-DD
  day: number; // 1..31
  isCandidate: boolean; // 후보 기간 내 & 버퍼 아님
  isWeekend: boolean;
}
export interface MonthGrid {
  label: string; // "2026년 8월"
  weeks: (DayCell | null)[][]; // 각 주 7칸, null=빈칸(다른 달)
}

export const WEEKDAY_HEAD = ["일", "월", "화", "수", "목", "금", "토"];

// 후보 기간이 걸친 모든 달을 달력 그리드로 만든다.
// allowedKeys 에 있는 날짜만 isCandidate=true (선택 가능).
export function buildCalendar(
  windowStart: Date,
  windowEnd: Date,
  allowedKeys: Set<string>,
): MonthGrid[] {
  const candSet = allowedKeys;

  const start = toDateOnly(windowStart);
  const end = toDateOnly(windowEnd);

  const months: MonthGrid[] = [];
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  const endY = end.getUTCFullYear();
  const endM = end.getUTCMonth();

  let guard = 0;
  while ((y < endY || (y === endY && m <= endM)) && guard < 36) {
    guard++;
    const first = new Date(Date.UTC(y, m, 1));
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const lead = first.getUTCDay(); // 1일의 요일 (0=일)

    const cells: (DayCell | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(y, m, d));
      const key = dateKey(date);
      const wd = date.getUTCDay();
      cells.push({
        key,
        day: d,
        isCandidate: candSet.has(key),
        isWeekend: wd === 0 || wd === 6,
      });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (DayCell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    months.push({ label: `${y}년 ${m + 1}월`, weeks });

    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return months;
}
