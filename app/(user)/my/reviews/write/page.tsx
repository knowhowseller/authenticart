'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Star } from 'lucide-react'

function WriteReviewForm() {
  const params = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const classId = params.get('classId') ?? ''
  const bookingId = params.get('bookingId') ?? ''

  const [classTitle, setClassTitle] = useState('')
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [existing, setExisting] = useState(false)

  useEffect(() => {
    if (!classId) return
    async function load() {
      const [{ data: cls }, { data: { user } }] = await Promise.all([
        supabase.from('classes').select('title').eq('id', classId).single(),
        supabase.auth.getUser(),
      ])
      if (cls) setClassTitle(cls.title)
      if (user) {
        const { data: review } = await supabase
          .from('class_reviews')
          .select('id')
          .eq('class_id', classId)
          .eq('student_id', user.id)
          .single()
        if (review) setExisting(true)
      }
    }
    load()
  }, [classId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) { toast.error('후기 내용을 입력해주세요'); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('로그인이 필요합니다'); return }
      const { error } = await supabase.from('class_reviews').insert({
        class_id: classId,
        student_id: user.id,
        booking_id: bookingId || null,
        rating,
        content: content.trim(),
      })
      if (error) throw new Error(error.message)
      toast.success('후기가 등록되었습니다')
      router.push(`/classes/${classId}#reviews`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!classId) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-grey">잘못된 접근입니다</p>
        <Link href="/my/bookings" className="text-brand-deep text-sm mt-2 block hover:underline">예약 목록으로</Link>
      </div>
    )
  }

  if (existing) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-brand-ink font-medium mb-1">이미 후기를 작성했습니다</p>
        <Link href={`/classes/${classId}#reviews`} className="text-brand-deep text-sm hover:underline">클래스 페이지에서 확인</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-brand-amber/10 rounded-xl p-4">
        <p className="text-xs text-brand-grey mb-0.5">클래스</p>
        <p className="text-sm font-semibold text-brand-ink">{classTitle || '로딩 중...'}</p>
      </div>

      {/* 별점 */}
      <div>
        <label className="text-sm font-medium text-brand-ink block mb-2">별점</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              className="p-0.5"
            >
              <Star
                size={28}
                className={`transition-colors ${star <= (hover || rating) ? 'fill-brand-amber text-brand-amber' : 'text-brand-mist'}`}
              />
            </button>
          ))}
          <span className="ml-2 self-center text-sm font-medium text-brand-ink">{rating}점</span>
        </div>
      </div>

      {/* 내용 */}
      <div>
        <label className="text-sm font-medium text-brand-ink block mb-2">후기 내용</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="수강 소감, 강사 설명, 분위기 등 솔직한 후기를 남겨주세요 (최소 10자)"
          rows={5}
          maxLength={500}
          className="w-full text-sm border border-brand-mist/50 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-deep/20"
        />
        <p className="text-xs text-brand-grey text-right mt-1">{content.length}/500</p>
      </div>

      <button
        type="submit"
        disabled={loading || content.trim().length < 10}
        className="w-full py-3.5 bg-brand-deep text-white rounded-2xl font-semibold text-sm hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
      >
        {loading ? '등록 중...' : '후기 등록'}
      </button>
    </form>
  )
}

export default function WriteReviewPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-md mx-auto px-4 py-8">
        <Link href="/my/bookings" className="text-sm text-brand-grey hover:text-brand-deep mb-6 block">
          ← 예약 목록
        </Link>
        <h1 className="text-xl font-bold text-brand-ink mb-6">후기 작성</h1>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
          <Suspense fallback={<p className="text-brand-grey text-sm text-center py-8">로딩 중...</p>}>
            <WriteReviewForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
