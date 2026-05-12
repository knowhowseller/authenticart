import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Lock, ChevronLeft } from 'lucide-react'
import BoardReplyBox from './BoardReplyBox'

async function getPost(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('board_posts').update({ view_count: supabase.rpc('increment' as any, { x: 1 }) as any }).eq('id', id)

  const [{ data: post }, { data: replies }, { data: userData }] = await Promise.all([
    supabase.from('board_posts').select('*').eq('id', id).single(),
    supabase.from('board_replies').select('*').eq('post_id', id).order('created_at'),
    user ? supabase.from('users').select('role, name').eq('id', user.id).single() : Promise.resolve({ data: null }),
  ])

  return { post, replies: replies ?? [], user, userData }
}

const TYPE_LABELS: Record<string, string> = {
  notice: '공지사항', free: '자유게시판', inquiry: '1:1 문의',
  class_request: '클래스 요청', group_request: '단체 출강 요청',
}

export default async function BoardPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { post, replies, user, userData } = await getPost(id)
  if (!post) notFound()

  const isAdmin = ['admin', 'branch_manager'].includes(userData?.role ?? '')
  const canView = !post.is_private || post.author_id === user?.id || isAdmin

  if (!canView) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <Lock size={32} className="text-brand-grey mx-auto mb-3" />
          <p className="text-brand-grey">비밀글입니다. 작성자와 관리자만 볼 수 있습니다.</p>
          <Link href="/board" className="mt-4 inline-block text-sm text-brand-deep hover:underline">게시판으로</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/board" className="flex items-center gap-1 text-sm text-brand-grey hover:text-brand-deep mb-6">
          <ChevronLeft size={16} /> 게시판으로
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden mb-4">
          {/* 헤더 */}
          <div className="px-6 py-5 border-b border-brand-mist/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-brand-bg text-brand-grey px-2 py-0.5 rounded-full">{TYPE_LABELS[post.type] ?? post.type}</span>
              {post.is_private && <Lock size={12} className="text-brand-grey" />}
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                post.status === 'closed' ? 'bg-brand-bg text-brand-grey' :
                post.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
              }`}>
                {post.status === 'closed' ? '완료' : post.status === 'in_progress' ? '처리 중' : '접수'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-brand-ink">{post.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-brand-grey">
              <span>{post.author_name}</span>
              <span>{new Date(post.created_at).toLocaleString('ko-KR')}</span>
              <span>조회 {post.view_count}</span>
            </div>
          </div>
          {/* 본문 */}
          <div className="px-6 py-6">
            <p className="text-sm text-brand-ink/90 leading-relaxed whitespace-pre-line">{post.content}</p>
          </div>
        </div>

        {/* 답글 */}
        {replies.length > 0 && (
          <div className="space-y-3 mb-4">
            {replies.map((r: any) => (
              <div key={r.id} className={`rounded-2xl p-4 ${r.is_admin ? 'bg-brand-deep/5 border border-brand-deep/10' : 'bg-white shadow-sm border border-brand-mist/30'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {r.is_admin && <span className="text-[10px] bg-brand-deep text-white px-2 py-0.5 rounded-full font-semibold">관리자</span>}
                  <span className="text-xs font-medium text-brand-ink">{r.author_name}</span>
                  <span className="text-xs text-brand-grey">{new Date(r.created_at).toLocaleString('ko-KR')}</span>
                </div>
                <p className="text-sm text-brand-ink/90 whitespace-pre-line">{r.content}</p>
              </div>
            ))}
          </div>
        )}

        {user && post.status !== 'closed' && (
          <BoardReplyBox postId={id} />
        )}
      </div>
    </div>
  )
}
