# 자가호스팅용 이미지 — 개인 이벤트 앱이라 단순·확실하게 (full node_modules 유지)
FROM node:20-alpine

# Prisma 엔진에 openssl 필요
RUN apk add --no-cache openssl
RUN corepack enable

WORKDIR /app

# 의존성 먼저 (캐시 활용). prisma schema 가 있어야 postinstall(generate) 성공
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# 나머지 소스
COPY . .

RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# 시작 시 스키마를 DB에 반영한 뒤 서버 기동
CMD ["sh", "-c", "pnpm prisma db push --skip-generate && pnpm start"]
