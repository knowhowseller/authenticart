'use client'
import { useState, useTransition } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { submitReview, deleteReview } from '@/app/actions/reviews'

interface Review {
  id: string
  rating: number
  content: string | null
  reply: string | null
  replied_at: string | null
  created_at: string
  student_id: string
  users?: { name: string } | null
}

interface ReviewSectionProps {
  classId: string
  reviews: Review[]
  currentUserId?: string
  currentUserRole?: string
  instructorId?: string
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
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className="focus:outline-none disabled:cursor-default"
        >
          <Star
            size={readonly ? 14 : 24}
            className={`transition-colors ${
              star <= (hover || value) ? 'text-brand-amber fill-brand-amber' : 'text-brand-mist'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function ReplyBox({ reviewId, existingReply, repliedAt, canReply }: {
  reviewId: string
  existingReply: string | null
  repliedAt: string | null
  canReply: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState(existingReply ?? '')
  const [reply, setReply] = useState(existingReply)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!text.trim()) return
    setLoading(true)
    const res = await fetch('/api/reviews/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, reply: text }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('답글 등록에 실패했습니다'); return }
    setReply(text)
    setShowForm(false)
    toast.success('답글이 등록되었습니다')
  }

  return (
    <div className="mt-2 ml-4 pl-3 border-l-2 border-brand-mist/30">
      {reply ? (
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-brand-deep">강사 답글</p>
            {canReply && (
              <button onClick={() => setShowForm(!showForm)} className="text-xs text-brand-grey hover:text-brand-deep">
                수정
              </button>
            )}
          </div>
          {!showForm && <p className="text-sm text-brand-grey mt-1 leading-relaxed">{reply}</p>}
          {showForm && (
            <div className="mt-2">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={2}
                className="w-full text-sm px-3 py-2 rounded-lg border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none"
              />
              <div className="flex gap-2 mt-1.5">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="text-xs font-medium bg-brand-deep text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
                <button onClick={() => { setShowForm(false); setText(reply) }} className="text-xs text-brand-grey">
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      ) : canReply ? (
        showForm ? (
          <div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="수강생 후기에 답글을 남겨보세요..."
              rows={2}
              className="w-full text-sm px-3 py-2 rounded-lg border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none"
            />
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={handleSubmit}
                disabled={loading || !text.trim()}
                className="text-xs font-medium bg-brand-deep text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                {loading ? '저장 중...' : '답글 등록'}
              </button>
              <button onClick={() => setShowForm(false)} className="text-xs text-brand-grey">취소</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs text-brand-grey hover:text-brand-deep transition-colors"
          >
            <MessageSquare size={11} />
            답글 달기
          </button>
        )
      ) : null}
    </div>
  )
}

export default function ReviewSection({
  classId, reviews, currentUserId, currentUserRole, instructorId, bookingId, hasReviewed,
}: ReviewSectionProps) {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const canReply = currentUserId === instructorId || currentUserRole === 'admin'

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
    <div id="reviews" className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
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

      {currentUserId && bookingId && !hasReviewed && (
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

      {reviews.length === 0 ? (
        <p className="text-sm text-brand-grey text-center py-6">아직 후기가 없습니다. 첫 후기를 남겨보세요!</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-brand-mist/20 last:border-0 pb-5 last:pb-0">
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
              <ReplyBox
                reviewId={r.id}
                existingReply={r.reply}
                repliedAt={r.replied_at}
                canReply={canReply}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
