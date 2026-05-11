import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import UserRoleEditor from './UserRoleEditor'
import type { UserRole } from '@/types/database'

const ROLE_LABEL: Record<UserRole, string> = {
  student:        '수강생',
  instructor:     '강사',
  branch_manager: '지부장',
  admin:          '관리자',
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/')

  const { q, role: filterRole, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))
  const pageSize = 20
  const from = (page - 1) * pageSize

  let query = supabase
    .from('users')
    .select('id, email, name, role, region, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (q) query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`)
  if (filterRole) query = query.eq('role', filterRole)

  const { data: users, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">회원 관리</h1>

        {/* 검색 + 필터 */}
        <form className="flex flex-wrap gap-3 mb-6">
          <input
            name="q"
            defaultValue={q}
            placeholder="이름 또는 이메일 검색"
            className="flex-1 min-w-48 text-sm px-4 py-2 rounded-xl border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber bg-white"
          />
          <select
            name="role"
            defaultValue={filterRole ?? ''}
            className="text-sm px-3 py-2 rounded-xl border border-brand-mist bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber"
          >
            <option value="">전체 역할</option>
            <option value="student">수강생</option>
            <option value="instructor">강사</option>
            <option value="branch_manager">지부장</option>
            <option value="admin">관리자</option>
          </select>
          <button
            type="submit"
            className="text-sm font-medium bg-brand-deep text-white px-5 py-2 rounded-xl hover:bg-brand-deep/90 transition-colors"
          >
            검색
          </button>
        </form>

        {/* 집계 */}
        <p className="text-xs text-brand-grey mb-4">총 {count ?? 0}명</p>

        {/* 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg border-b border-brand-mist/30">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-brand-grey">이름</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-brand-grey">이메일</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-brand-grey">지역</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-brand-grey">가입일</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-brand-grey">역할</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-mist/20">
              {users?.map(u => (
                <tr key={u.id} className="hover:bg-brand-bg/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-brand-ink">{u.name}</td>
                  <td className="px-4 py-3 text-brand-grey">{u.email}</td>
                  <td className="px-4 py-3 text-brand-grey">{u.region ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-grey">
                    {new Date(u.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleEditor userId={u.id} currentRole={u.role as UserRole} />
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-brand-grey">
                    회원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <a
                key={p}
                href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(filterRole ? { role: filterRole } : {}), page: String(p) })}`}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${
                  p === page
                    ? 'bg-brand-deep text-white font-medium'
                    : 'bg-white text-brand-grey hover:bg-brand-bg border border-brand-mist/30'
                }`}
              >
                {p}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
