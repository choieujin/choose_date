import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const d = (s) => new Date(`${s}T00:00:00.000Z`);

const event = await prisma.event.create({
  data: {
    groomName: "승우",
    brideName: "유진",
    weddingDate: d("2026-10-18"),
    windowStart: d("2026-09-05"),
    windowEnd: d("2026-09-20"),
    bufferDays: 3,
    groups: {
      create: [
        {
          name: "대학 친구들",
          slotType: "BOTH",
          inviteMsg: "얘들아 나 결혼해! 청첩장 주면서 밥 한번 사고 싶은데 언제 좋아?",
          members: { create: [{ name: "민지" }, { name: "현우" }, { name: "지수" }] },
        },
        {
          name: "회사 사람들",
          slotType: "DINNER",
          inviteMsg: "결혼 소식 전하려고요! 저녁 한 끼 같이 해요 :)",
          members: { create: [{ name: "박팀장" }, { name: "김대리" }] },
        },
      ],
    },
  },
  include: { groups: { include: { members: true } } },
});

console.log("HOST", event.hostToken);
for (const g of event.groups) {
  console.log(`GROUP ${g.name} (${g.slotType}) id=${g.id}`);
  for (const m of g.members) console.log(`  ${m.name} -> /vote/${m.token}`);
}
await prisma.$disconnect();
