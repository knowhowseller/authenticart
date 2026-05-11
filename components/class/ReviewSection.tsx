'use client'
import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { submitReview, deleteReview } from '@/app/actions/reviews'

interface Review {
  id: string
  rating: number
  content: string | null
  created_at: string
  student_id: string
  users?: { name: string } | null
}

interface ReviewSectionProps {
  classId: string
  reviews: Review[]
  currentUserId?: string
  bookingId?: string
  hasReviewed?: boolean
}

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={readonly ? 'button' : 'button'}
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className="focus:outline-none disabled:cursor-default"
        >
          <Star
            size={readonly ? 14 : 24}
            className={`transition-colors ${
              star <= (hover || value)
                ? 'text-brand-amber fill-brand-amber'
                : 'text-brand-mist'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function ReviewSection({
  classId, reviews, currentUserId, bookingId, hasReviewed,
}: ReviewSectionProps) {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('별점을 선택해주세요.'); return }
    setError('')
    const fd = new FormData()
    fd.append('class_id', classId)
    fd.append('rating', String(rating))
    fd.append('content', content)
    if (bookingId) fd.append('booking_id', bookingId)
    startTransition(async () => {
      const res = await submitReview(fd)
      if (res.error) setError(res.error)
    })
  }

  async function handleDelete() {
    startTransition(async () => { await deleteReview(classId) })
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-brand-ink">
          수강 후기 <span className="text-brand-grey font-normal">({reviews.length})</span>
        </h2>
        {avgRating && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(parseFloat(avgRating))} readonly />
            <span className="text-sm font-bold text-brand-deep">{avgRating}</span>
          </div>
        )}
      </div>

      {/* 작성 폼 */}
      {currentUserId && !hasReviewed && (
        <form onSubmit={handleSubmit} className="mb-6 bg-brand-bg rounded-xl p-4 border border-brand-mist/30">
          <p className="text-sm font-medium text-brand-ink mb-3">후기 작성</p>
          <div className="mb-3">
            <StarRating value={rating} onChange={setRating} />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="수강 후기를 남겨주세요 (선택)"
            className="w-full text-sm px-3 py-2 rounded-lg border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={isPending}
            className="mt-3 text-sm font-medium bg-brand-deep text-white px-4 py-2 rounded-full hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? '저장 중...' : '후기 등록'}
          </button>
        </form>
      )}

      {/* 리뷰 목록 */}
      {reviews.length === 0 ? (
        <p className="text-sm text-brand-grey text-center py-6">아직 후기가 없습니다. 첫 후기를 남겨보세요!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-brand-mist/20 last:border-0 pb-4 last:pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-ink">{r.users?.name ?? '수강생'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating value={r.rating} readonly />
                    <span className="text-xs text-brand-grey">
                      {new Date(r.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                {currentUserId === r.student_id && (
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-xs text-brand-grey hover:text-red-500 transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>
              {r.content && (
                <p className="text-sm text-brand-grey mt-2 leading-relaxed">{r.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
