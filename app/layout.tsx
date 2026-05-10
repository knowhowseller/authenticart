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
    default: '오센틱아트 — Starting a second life with Authentic Art',
    template: '%s | 오센틱아트',
  },
  description: '레진 공예 중심의 강사·수강생 생태계 플랫폼. 클래스를 예약하고, 재료를 구매하세요.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://authenticart.kr'),
  openGraph: {
    siteName: '오센틱아트',
    locale: 'ko_KR',
    type: 'website',
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
