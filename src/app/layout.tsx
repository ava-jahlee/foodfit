import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FoodFit - 맞춤형 식사 메뉴 추천',
  description: '날씨, 기분, 식단에 맞는 완벽한 메뉴를 추천해드려요!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
