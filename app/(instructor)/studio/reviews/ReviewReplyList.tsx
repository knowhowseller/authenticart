'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Star, MessageSquare, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Review {
  id: string
  rating: number
  content: string
  reply: string | null
  replied_at: string | null
  created_at: string
  users: { name: string } | null
  classes: { title: string } | null
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={12} className={i <= rating ? 'fill-brand-amber text-brand-amber' : 'text-brand-mist fill-brand-mist'} />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const [reply, setReply] = useState(review.reply ?? '')
  const [editing, setEditing] = useState(!review.reply)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!review.reply)

  async function handleSave() {
    if (!reply.trim()) return
    setSaving(true)
    const res = await fetch('/api/reviews/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: review.id, reply }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('답글이 저장되었습니다')
      setSaved(true)
      setEditing(false)
    } else {
      toast.error('저장 실패')
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
      {/* 클래스 + 수강생 */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="text-xs text-brand-grey truncate">{review.classes?.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm font-medium text-brand-ink">{review.users?.name ?? '익명'}</p>
            <StarRow rating={review.rating} />
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {saved && !editing ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle size={12} /> 답글 완료
            </span>
          ) : (
            <span className="text-xs text-orange-500">미답글</span>
          )}
          <p className="text-xs text-brand-grey mt-0.5">
            {new Date(review.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>

      {/* 후기 내용 */}
      <p className="text-sm text-brand-ink leading-relaxed bg-brand-bg rounded-xl px-4 py-3 mb-3">
        {review.content}
      </p>

      {/* 답글 영역 */}
      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-brand-deep font-medium">
            <MessageSquare size={12} />
            강사 답글
          </div>
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            rows={3}
            placeholder="수강생에게 감사 인사나 답변을 남겨주세요"
            className="w-full px-3.5 py-2.5 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} loading={saving} className="flex-1">
              저장
            </Button>
            {saved && (
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="flex-1">
                취소
              </Button>
            )}
          </div>
        </div>
      ) : saved && reply ? (
        <div className="bg-brand-deep/5 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-brand-deep flex items-center gap-1">
              <MessageSquare size={11} /> 강사 답글
            </span>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-brand-grey hover:text-brand-deep transition-colors"
            >
              수정
            </button>
          </div>
          <p className="text-sm text-brand-ink leading-relaxed">{reply}</p>
          {review.replied_at && (
            <p className="text-xs text-brand-grey mt-1">
              {new Date(review.replied_at).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default function ReviewReplyList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
        <div className="text-4xl mb-3">⭐</div>
        <p className="text-brand-grey font-medium">아직 후기가 없습니다</p>
        <p className="text-sm text-brand-grey mt-1">첫 클래스 후기를 기다려보세요</p>
      </div>
    )
  }

  const unanswered = reviews.filter(r => !r.reply)
  const answered = reviews.filter(r => r.reply)

  return (
    <div className="space-y-4">
      {unanswered.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-3">
            미답글 ({unanswered.length})
          </p>
          <div className="space-y-4">
            {unanswered.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        </div>
      )}
      {answered.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-3 mt-6">
            답글 완료 ({answered.length})
          </p>
          <div className="space-y-4">
            {answered.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        </div>
      )}
    </div>
  )
}
