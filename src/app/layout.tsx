import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "청모 · 청첩장 모임 날짜 잡기",
  description: "그룹별로 청첩장 밥약 날짜를 투표하고, 겹치지 않게 잡아요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        {/* 폰트는 빌드 때 받지 않고 브라우저에서 로드 (Docker 빌드 네트워크 의존 제거) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Sans+KR:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper min-h-full flex flex-col">{children}</body>
    </html>
  );
}
