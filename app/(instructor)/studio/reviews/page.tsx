import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import ReviewReplyList from './ReviewReplyList'

async function getMyReviews(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('class_reviews')
    .select(`
      id, rating, content, reply, replied_at, created_at,
      users!student_id(name),
      classes!class_id(title, instructor_id)
    `)
    .order('created_at', { ascending: false })
  const mine = (data ?? []).filter((r: any) => r.classes?.instructor_id === userId)
  return mine
}

export default async function StudioReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['instructor', 'admin'].includes(userData?.role ?? '')) redirect('/')

  const reviews = await getMyReviews(user.id)
  const unanswered = reviews.filter((r: any) => !r.reply).length

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="deep" size={16} />
          <span className="text-xs font-medium text-brand-deep uppercase tracking-wider">Studio</span>
        </div>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">수강 후기 관리</h1>
            <p className="text-brand-grey text-sm mt-0.5">
              전체 {reviews.length}개
              {unanswered > 0 && (
                <span className="ml-2 text-orange-500 font-medium">· 미답글 {unanswered}개</span>
              )}
            </p>
          </div>
        </div>

        <ReviewReplyList reviews={reviews as any[]} />
      </div>
    </div>
  )
}
