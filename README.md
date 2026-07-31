# 청모 (Cheongmo) — 청첩장 모임 날짜 잡기

> 결혼 앞두고 **청첩장 밥약**을 그룹별로 잡되, 신랑·신부 일정이 **겹치지 않게** 자동으로 막아주는 셀프호스팅 웹앱.

친구·회사·가족처럼 그룹마다 따로 날짜를 투표받고, 한 모임 날짜가 **확정되면 그 시간은 다른 모든 그룹 투표에서 자동으로 잠깁니다.** 신랑/신부는 몸이 하나니까요.

일반적인 날짜 투표 툴(When2meet, 언제어때)과의 차이가 바로 이 **그룹 간 중복 잠금**입니다.

<br>

## ✨ 주요 기능

| 기능 | 설명 |
|---|---|
| 👰 이벤트 생성 | 신랑·신부 이름, 결혼식 날짜, 후보 기간 설정. 예식일 앞뒤 버퍼일 자동 제외 |
| 👥 그룹별 투표 | 그룹마다 **점심 / 저녁 / 둘다** 시간대를 지정 |
| 🔗 개인 링크 | 멤버 이름을 등록하면 사람마다 고유 링크 생성. 접속하면 **"안녕하세요 ○○님 🎉"** 개인화 환영 |
| 📅 달력 투표 | 월별 달력에서 날짜를 눌러 **가능(O) / 애매(△) / 불가(X)** 선택 (탭할 때마다 순환) |
| 🍽 시간대 선호 | "둘다" 그룹은 날짜만 고르고, 점심/저녁 선호는 **멤버당 한 번**만 체크 |
| 🔒 중복 잠금 | 한 (날짜, 시간대)를 확정하면 다른 그룹에선 그 슬롯이 자동으로 잠김 (DB 유니크 제약으로 보장) |
| 📊 진행률 시각화 | 그룹별 투표 진행률 바 + "투표 완료 ✓" 뱃지로 한눈에 확인 |
| 🎉 확정 안내 | 확정되면 투표자에게 "날짜가 정해졌어요" 안내 화면 표시 |

<br>

## 🧱 기술 스택

- **Next.js 16** (App Router, Server Actions) + **React 19**
- **TypeScript**
- **Prisma** + **PostgreSQL**
- **Tailwind CSS v4**
- **Docker Compose** (셀프호스팅)

로그인/결제/외부 API 없이, **로컬 Docker + 무료 터널**만으로 운영하도록 설계했습니다.

<br>

## 🚀 빠른 시작 (로컬 개발)

### 0. 준비물
- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 9+ (`npm i -g pnpm`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 데이터베이스 띄우기 (Postgres)
```bash
docker compose -p cheongmo up -d db
```
> 폴더명이 한글(청모)이라 `-p cheongmo`로 프로젝트명을 명시합니다. `.env`에도 `COMPOSE_PROJECT_NAME=cheongmo`가 들어 있습니다.

### 3. 스키마 반영
```bash
pnpm prisma db push
```

### 4. 개발 서버 실행
```bash
pnpm dev
```
→ http://localhost:3000

### (선택) 예시 데이터 넣기
```bash
node prisma/seed.mjs
```
샘플 이벤트 + 그룹 + 멤버가 생성되고, 콘솔에 **호스트 링크**와 **멤버 투표 링크**가 출력됩니다.

<br>

## 📖 사용법

### 호스트 (신랑/신부)
1. 첫 화면에서 **이름·결혼식 날짜·후보 기간**을 입력하고 시작
2. 생성되면 `/host/<토큰>` **관리자 링크**가 나옵니다 → **꼭 저장하세요** (이게 관리자 페이지)
3. **그룹 추가**: 이름 + 시간대(점심/저녁/둘다) + 초대 문구
4. 그룹에 들어가 **멤버 이름 등록** → 각자 개인 링크가 생김 → 카톡으로 공유
5. 대시보드에서 **진행률**을 확인, 다 모이면 집계 보고 **날짜 확정**
6. 확정하면 그 시간대는 다른 그룹에서 자동으로 잠깁니다

### 투표자 (그룹 멤버)
1. 받은 개인 링크 접속 → "안녕하세요 ○○님 🎉" + 초대 문구
2. 달력에서 가능한 날짜를 눌러 O/△/X 선택 (둘다 그룹이면 점심/저녁 선호도 한 번 체크)
3. 제출 → 나중에 다시 들어와 수정 가능
4. 확정되면 접속 시 확정된 날짜 안내가 보임

<br>

## 🌐 배포 (셀프호스팅 + 무료 공개 주소)

친구들은 각자 폰(다른 네트워크)에서 접속하므로 `localhost`로는 안 됩니다. **Cloudflare Tunnel(무료)** 로 공개 https 주소를 만드는 걸 권장합니다. 항상 켜둘 수 있는 데스크톱을 호스트로 쓰세요.

### 1. 앱 + DB 함께 실행 (프로덕션)
```bash
NEXT_PUBLIC_BASE_URL="https://your-tunnel-url" \
  docker compose -p cheongmo --profile full up -d --build
```
→ 컨테이너 시작 시 자동으로 `prisma db push` 후 서버가 뜹니다 (http://localhost:3000).

### 2. Cloudflare Tunnel 연결 (무료)
```bash
# cloudflared 설치 후
cloudflared tunnel --url http://localhost:3000
```
출력되는 `https://xxxx.trycloudflare.com` 주소를 친구들에게 공유하면 됩니다.
(고정 주소가 필요하면 Cloudflare 계정에 named tunnel을 만드세요.)

> 이벤트가 끝나면 `docker compose -p cheongmo down` 으로 정리. 상시 서비스가 아니라 결혼식 전 몇 주만 띄우는 용도입니다.

<br>

## 🔐 중복 방지는 어떻게 보장되나

핵심은 **DB 유니크 제약** 하나입니다.

```prisma
model Confirmation {
  eventId String
  groupId String @unique          // 그룹당 확정 1개
  date    DateTime @db.Date
  slot    Slot                    // LUNCH | DINNER

  @@unique([eventId, date, slot]) // ★ 한 (날짜,시간대)는 이벤트 전체에서 단 한 번
}
```

- 한 `(이벤트, 날짜, 시간대)` 슬롯은 **단 한 그룹만** 확정 가능
- 그룹 A가 `10/12 저녁`을 잡으면 → 다른 그룹의 `10/12 저녁`은 DB가 거부
- 같은 날 **점심은 여전히 열림** → 다른 그룹이 `10/12 점심`을 잡을 수 있음
- 두 그룹이 동시에 같은 슬롯을 확정 시도해도 트랜잭션 + 유니크 제약으로 한쪽만 성공 (경쟁 조건 방지)

투표 화면과 확정 화면 모두, 다른 그룹이 잡은 슬롯은 🔒로 표시되고 선택이 막힙니다.

<br>

## 🗂 데이터 모델

```
Event         신랑·신부, 결혼식 날짜, 후보 기간, 버퍼일, 호스트 토큰
 └ Group      이름, 시간대(LUNCH|DINNER|BOTH), 초대 문구
     └ Member 이름, 개인 토큰, 점심/저녁 선호(BOTH만), 제출 여부
         └ Vote  날짜별 O/△/X
 └ Confirmation  확정 (날짜, 시간대) — 전역 유니크
```

전체 스키마는 [`prisma/schema.prisma`](prisma/schema.prisma) 참고.

<br>

## 📁 폴더 구조

```
src/
├─ app/
│  ├─ page.tsx                         # 이벤트 생성 (홈)
│  ├─ host/[hostToken]/page.tsx        # 호스트 대시보드
│  ├─ host/[hostToken]/group/[groupId] # 그룹 관리·집계·확정
│  └─ vote/[memberToken]/page.tsx      # 투표자 페이지
├─ components/
│  ├─ VoteCalendar.tsx                 # 달력 투표 UI
│  ├─ ConfirmGrid.tsx                  # 호스트 확정 UI
│  ├─ MembersManager.tsx               # 멤버·링크 관리
│  └─ CopyButton.tsx
└─ lib/
   ├─ actions.ts                       # 서버 액션 (생성/투표/확정)
   ├─ domain.ts                        # 달력·날짜·라벨 유틸
   └─ prisma.ts                        # Prisma 싱글턴
```

<br>

## ⚙️ 환경 변수

`.env` 예시 ([`.env.example`](.env.example) 참고):

```bash
DATABASE_URL="postgresql://cheongmo:cheongmo@localhost:5432/cheongmo?schema=public"
COMPOSE_PROJECT_NAME=cheongmo
# 배포 시 (Docker web 컨테이너)
# NEXT_PUBLIC_BASE_URL="https://your-tunnel-url"
```

<br>

## 🧭 자주 쓰는 명령어

```bash
pnpm dev                                   # 개발 서버
pnpm build && pnpm start                   # 프로덕션 실행
pnpm prisma db push                        # 스키마 반영
pnpm prisma studio                         # DB GUI
docker compose -p cheongmo up -d db        # DB만 실행
docker compose -p cheongmo down            # 정리
```

<br>

## 📝 라이선스

개인 프로젝트. 자유롭게 참고하세요.
