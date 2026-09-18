import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

// 숫자·환율 표기용 고정폭 폰트. 한글 본문은 Pretendard(globals.css + <link>).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "환전 어디서? — 여행 환전 비교 계산기",
  description:
    "가진 돈과 여행지를 고르고, 환전소에 표시된 환율로 여행지에서 받을 돈을 비교해 보세요.",
};

// 다크모드 선반영(FOUC 방지): 렌더 전에 저장값/시스템 설정으로 .dark 토글
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${geistMono.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
