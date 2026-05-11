'use client'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export default function FloatingCTA() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      <Link
        href="/signup/instructor"
        className="flex items-center gap-2 bg-brand-deep text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg hover:bg-brand-deep/90 transition-all hover:scale-105"
      >
        강사 상담 신청
      </Link>
      <Link
        href="/classes"
        className="flex items-center gap-2 bg-brand-amber text-brand-ink text-sm font-medium px-4 py-2.5 rounded-full shadow-lg hover:bg-brand-amber/90 transition-all hover:scale-105"
      >
        <MessageCircle size={15} />
        클래스 예약하기
      </Link>
    </div>
  )
}
