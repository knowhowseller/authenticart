import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Toaster } from 'sonner'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

const noto = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: '오센틱아트 — 공예·예술 클래스 & 재료 쇼핑 플랫폼',
    template: '%s | 오센틱아트',
  },
  description: '레진아트·캔들·플라워·도자기·주얼리·자수·회화·목공예 — 전 장르 공예·예술 클래스 예약, 재료 구매, 작품 판매를 한 플랫폼에서. 취미를 직업으로.',
  keywords: '공예 클래스, 원데이클래스, 레진아트, 캔들 만들기, 플라워 클래스, 도자기 체험, 주얼리 공방, 자수 배우기, 수채화 클래스, 목공예, 공예 재료, 강사 자격증',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'),
  openGraph: {
    siteName: '오센틱아트',
    locale: 'ko_KR',
    type: 'website',
    description: '레진아트·캔들·플라워·도자기·주얼리·자수·회화·목공예 전 장르 공예·예술 플랫폼',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${noto.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-brand-bg text-brand-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
