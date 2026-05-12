'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

const TYPE_OPTIONS = [
  { value: 'free',          label: '자유게시판' },
  { value: 'inquiry',       label: '1:1 문의 (비밀글)' },
  { value: 'class_request', label: '클래스 요청' },
]

export default function BoardNewPage() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [form, setForm] = useState({
    type: params.get('type') ?? 'free',
    title: '',
    content: '',
    is_private: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      const { data } = await supabase.from('users').select('name, email').eq('id', u.id).single()
      if (data) setUser({ id: u.id, name: data.name, email: data.email ?? '' })
    })
  }, [])

  async function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) { toast.error('제목과 내용을 입력해주세요'); return }
    if (!user) { toast.error('로그인이 필요합니다'); router.push('/login'); return }

    const isPrivate = form.type === 'inquiry' ? true : form.is_private

    setSaving(true)
    const res = await fetch('/api/board/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        title: form.title,
        content: form.content,
        author_name: user.name,
        author_email: user.email,
        is_private: isPrivate,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error ?? '등록 실패'); return }
    toast.success('게시글이 등록되었습니다')
    router.push(`/board/${data.post_id}`)
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/board" className="text-sm text-brand-grey hover:text-brand-deep">게시판</Link>
          <span className="text-brand-grey">/</span>
          <span className="text-sm text-brand-ink font-medium">글쓰기</span>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 space-y-4">
          <div>
            <label className="text-xs font-medium text-brand-grey block mb-1.5">게시판 유형 *</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber">
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {form.type === 'inquiry' && (
            <div className="bg-purple-50 rounded-lg px-4 py-3 text-xs text-purple-700">
              1:1 문의는 자동으로 비밀글로 설정됩니다. 관리자만 내용을 확인하고 답변합니다.
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-brand-grey block mb-1.5">제목 *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="제목을 입력하세요"
              className="w-full px-3 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-grey block mb-1.5">내용 *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={10} placeholder="내용을 입력하세요"
              className="w-full px-3 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber resize-none" />
          </div>
          {form.type !== 'inquiry' && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_private}
                onChange={e => setForm(f => ({ ...f, is_private: e.target.checked }))}
                className="rounded border-brand-mist" />
              <span className="text-brand-grey">비밀글로 등록 (관리자와 본인만 볼 수 있음)</span>
            </label>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={() => router.back()} className="flex-1 py-3 rounded-xl border border-brand-mist text-brand-grey text-sm">취소</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-brand-deep text-white text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors">
            {saving ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
