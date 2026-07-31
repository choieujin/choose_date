import type { Metadata } from "next";
import { Nanum_Myeongjo, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const serif = Nanum_Myeongjo({
  variable: "--font-serif-kr",
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const sans = Noto_Sans_KR({
  variable: "--font-sans-kr",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

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
    <html lang="ko" className={`${serif.variable} ${sans.variable} h-full`}>
      <body className="bg-paper min-h-full flex flex-col">{children}</body>
    </html>
  );
}
