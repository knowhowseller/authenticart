import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import BlogManager from './BlogManager'
import type { BlogPost } from '@/lib/blog'

export const dynamic = 'force-dynamic'

export default async function AdminBlogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'branch_manager'].includes(u?.role ?? '')) redirect('/')

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin · Magazine</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-1">블로그(공예 매거진) 관리</h1>
        <p className="text-sm text-brand-grey mb-6">
          홍보·정보성 글을 작성하면 홈페이지와 <code className="text-brand-deep">/blog</code>에 노출됩니다.
          AI 에이전트가 만든 마크다운을 본문에 붙여넣어도 됩니다.
        </p>
        <BlogManager posts={(posts ?? []) as BlogPost[]} />
      </div>
    </div>
  )
}
