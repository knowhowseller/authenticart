'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X, Pencil, Trash2, Eye, EyeOff, Star, ExternalLink } from 'lucide-react'
import { BLOG_CATEGORIES, slugify, categoryLabel, type BlogPost, type BlogFaqItem } from '@/lib/blog'

interface FormState {
  title: string
  slug: string
  category: string
  excerpt: string
  cover_image: string
  content: string
  tagsText: string
  author_name: string
  faq: BlogFaqItem[]
  seo_title: string
  seo_description: string
  is_featured: boolean
  status: 'draft' | 'published'
}

const emptyForm: FormState = {
  title: '', slug: '', category: 'guide', excerpt: '', cover_image: '', content: '',
  tagsText: '', author_name: '오센틱아트', faq: [], seo_title: '', seo_description: '',
  is_featured: false, status: 'draft',
}

function postToForm(p: BlogPost): FormState {
  return {
    title: p.title, slug: p.slug, category: p.category, excerpt: p.excerpt ?? '',
    cover_image: p.cover_image ?? '', content: p.content, tagsText: (p.tags ?? []).join(', '),
    author_name: p.author_name, faq: p.faq ?? [], seo_title: p.seo_title ?? '',
    seo_description: p.seo_description ?? '', is_featured: p.is_featured, status: p.status,
  }
}

function formToPayload(f: FormState) {
  return {
    title: f.title, slug: f.slug, category: f.category, excerpt: f.excerpt,
    cover_image: f.cover_image, content: f.content,
    tags: f.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
    author_name: f.author_name, faq: f.faq.filter((x) => x.q.trim() && x.a.trim()),
    seo_title: f.seo_title, seo_description: f.seo_description,
    is_featured: f.is_featured, status: f.status,
  }
}

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber text-sm'

function PostForm({
  initial, onCancel, onSubmit, saving,
}: {
  initial: FormState
  onCancel: () => void
  onSubmit: (f: FormState) => void
  saving: boolean
}) {
  const [f, setF] = useState<FormState>(initial)
  const [showSeo, setShowSeo] = useState(false)
  const [slugTouched, setSlugTouched] = useState(initial.slug !== '')

  function setTitle(v: string) {
    setF((s) => ({ ...s, title: v, slug: slugTouched ? s.slug : slugify(v) }))
  }

  return (
    <div className="space-y-3">
      <input value={f.title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className={inputCls} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-brand-grey mb-1 block">URL 슬러그</label>
          <input
            value={f.slug}
            onChange={(e) => { setSlugTouched(true); setF((s) => ({ ...s, slug: e.target.value })) }}
            placeholder="url-slug"
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs text-brand-grey mb-1 block">카테고리</label>
          <select value={f.category} onChange={(e) => setF((s) => ({ ...s, category: e.target.value }))} className={inputCls}>
            {BLOG_CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.emoji} {c.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-brand-grey mb-1 block">요약 (메타 설명·카드·AI 인용에 사용 — 1~2문장)</label>
        <textarea value={f.excerpt} onChange={(e) => setF((s) => ({ ...s, excerpt: e.target.value }))}
          placeholder="이 글의 핵심을 한두 문장으로 요약하세요" rows={2} className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className="text-xs text-brand-grey mb-1 block">대표 이미지 URL (선택)</label>
        <input value={f.cover_image} onChange={(e) => setF((s) => ({ ...s, cover_image: e.target.value }))}
          placeholder="https://..." className={inputCls} />
      </div>

      <div>
        <label className="text-xs text-brand-grey mb-1 block">본문 (마크다운 — ## 제목, - 목록, **굵게**, [링크](url), ![이미지](url) 지원)</label>
        <textarea value={f.content} onChange={(e) => setF((s) => ({ ...s, content: e.target.value }))}
          placeholder={'## 소제목\n\n본문 내용을 작성하거나 AI가 생성한 마크다운을 붙여넣으세요.\n\n- 항목 1\n- 항목 2'}
          rows={14} className={`${inputCls} resize-y font-mono leading-relaxed`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-brand-grey mb-1 block">태그 (쉼표로 구분)</label>
          <input value={f.tagsText} onChange={(e) => setF((s) => ({ ...s, tagsText: e.target.value }))}
            placeholder="레진아트, 입문, 원데이클래스" className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-brand-grey mb-1 block">작성자 표시명</label>
          <input value={f.author_name} onChange={(e) => setF((s) => ({ ...s, author_name: e.target.value }))} className={inputCls} />
        </div>
      </div>

      {/* FAQ — AEO(AI 검색)용 구조화 데이터 */}
      <div className="bg-brand-bg/60 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-brand-ink">FAQ (AI 검색 최적화 — Q&A는 구조화 데이터로 노출됩니다)</label>
          <button type="button" onClick={() => setF((s) => ({ ...s, faq: [...s.faq, { q: '', a: '' }] }))}
            className="text-xs flex items-center gap-1 text-brand-deep font-medium">
            <Plus size={12} /> 질문 추가
          </button>
        </div>
        {f.faq.length === 0 && <p className="text-xs text-brand-grey">자주 묻는 질문을 추가하면 AI 검색 노출에 유리합니다 (선택).</p>}
        <div className="space-y-2">
          {f.faq.map((item, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 border border-brand-mist/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-brand-grey">Q{idx + 1}</span>
                <button type="button" onClick={() => setF((s) => ({ ...s, faq: s.faq.filter((_, i) => i !== idx) }))}>
                  <X size={13} className="text-brand-grey hover:text-red-500" />
                </button>
              </div>
              <input value={item.q}
                onChange={(e) => setF((s) => ({ ...s, faq: s.faq.map((x, i) => i === idx ? { ...x, q: e.target.value } : x) }))}
                placeholder="질문" className={`${inputCls} mb-1.5`} />
              <textarea value={item.a}
                onChange={(e) => setF((s) => ({ ...s, faq: s.faq.map((x, i) => i === idx ? { ...x, a: e.target.value } : x) }))}
                placeholder="답변" rows={2} className={`${inputCls} resize-none`} />
            </div>
          ))}
        </div>
      </div>

      {/* SEO 고급 (선택) */}
      <button type="button" onClick={() => setShowSeo((v) => !v)} className="text-xs text-brand-grey underline">
        {showSeo ? 'SEO 고급 설정 닫기' : 'SEO 고급 설정 (제목·설명 오버라이드)'}
      </button>
      {showSeo && (
        <div className="space-y-3 bg-brand-bg/60 rounded-xl p-4">
          <input value={f.seo_title} onChange={(e) => setF((s) => ({ ...s, seo_title: e.target.value }))}
            placeholder="SEO 타이틀 (미입력 시 제목 사용)" className={inputCls} />
          <textarea value={f.seo_description} onChange={(e) => setF((s) => ({ ...s, seo_description: e.target.value }))}
            placeholder="SEO 설명 (미입력 시 요약 사용)" rows={2} className={`${inputCls} resize-none`} />
        </div>
      )}

      {/* 옵션 */}
      <div className="flex items-center gap-5 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-brand-grey cursor-pointer">
          <input type="checkbox" checked={f.is_featured} onChange={(e) => setF((s) => ({ ...s, is_featured: e.target.checked }))} />
          홈페이지 노출
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-grey cursor-pointer">
          <input type="radio" name={`st-${initial.slug}`} checked={f.status === 'draft'} onChange={() => setF((s) => ({ ...s, status: 'draft' }))} />
          초안
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-grey cursor-pointer">
          <input type="radio" name={`st-${initial.slug}`} checked={f.status === 'published'} onChange={() => setF((s) => ({ ...s, status: 'published' }))} />
          발행(공개)
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => onSubmit(f)} disabled={saving}
          className="bg-brand-deep text-white text-sm font-medium px-5 py-2 rounded-full disabled:opacity-50">
          {saving ? '저장 중...' : '저장'}
        </button>
        <button onClick={onCancel} className="text-sm font-medium px-5 py-2 rounded-full border border-brand-mist text-brand-grey hover:bg-brand-bg">
          취소
        </button>
      </div>
    </div>
  )
}

export default function BlogManager({ posts: initial }: { posts: BlogPost[] }) {
  const [posts, setPosts] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleCreate(f: FormState) {
    if (!f.title.trim() || !f.content.trim()) { toast.error('제목과 본문을 입력해주세요'); return }
    setSaving(true)
    const res = await fetch('/api/admin/blog/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formToPayload(f)),
    })
    setSaving(false)
    if (!res.ok) { const e = await res.json().catch(() => ({})); toast.error(e.error ?? '저장 실패'); return }
    toast.success('글이 저장되었습니다')
    setCreating(false)
    router.refresh()
  }

  async function handleEdit(id: string, f: FormState) {
    if (!f.title.trim() || !f.content.trim()) { toast.error('제목과 본문을 입력해주세요'); return }
    setSaving(true)
    const res = await fetch('/api/admin/blog/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...formToPayload(f) }),
    })
    setSaving(false)
    if (!res.ok) { const e = await res.json().catch(() => ({})); toast.error(e.error ?? '수정 실패'); return }
    toast.success('수정되었습니다')
    setEditingId(null)
    router.refresh()
  }

  async function quickUpdate(p: BlogPost, patch: Record<string, unknown>) {
    const res = await fetch('/api/admin/blog/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, ...patch }),
    })
    if (!res.ok) { toast.error('업데이트 실패'); return }
    setPosts((prev) => prev.map((x) => x.id === p.id ? { ...x, ...patch } as BlogPost : x))
  }

  async function handleDelete(id: string) {
    if (!confirm('이 글을 삭제하시겠습니까?')) return
    const res = await fetch('/api/admin/blog/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    if (!res.ok) { toast.error('삭제 실패'); return }
    toast.success('삭제되었습니다')
    setPosts((prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <div>
      {/* 작성 */}
      {creating ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-brand-ink">새 글 작성</p>
            <button onClick={() => setCreating(false)}><X size={16} className="text-brand-grey" /></button>
          </div>
          <PostForm initial={emptyForm} onCancel={() => setCreating(false)} onSubmit={handleCreate} saving={saving} />
        </div>
      ) : (
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-brand-deep text-white text-sm font-medium px-4 py-2 rounded-full mb-4 hover:bg-brand-deep/90">
          <Plus size={14} /> 새 글 작성
        </button>
      )}

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
          <p className="text-brand-grey">작성된 글이 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
          {posts.map((p, i) => (
            <div key={p.id} className={i > 0 ? 'border-t border-brand-mist/20' : ''}>
              {editingId === p.id ? (
                <div className="p-5 bg-brand-bg/40">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-brand-ink">글 수정</p>
                    <button onClick={() => setEditingId(null)}><X size={15} className="text-brand-grey" /></button>
                  </div>
                  <PostForm initial={postToForm(p)} onCancel={() => setEditingId(null)} onSubmit={(f) => handleEdit(p.id, f)} saving={saving} />
                </div>
              ) : (
                <div className={`flex items-center justify-between px-5 py-4 gap-4 ${p.status !== 'published' ? 'opacity-60' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {p.is_featured && <Star size={12} className="text-brand-amber flex-shrink-0 fill-brand-amber" />}
                      <p className="text-sm font-medium text-brand-ink truncate">{p.title}</p>
                    </div>
                    <p className="text-xs text-brand-grey mt-0.5">
                      {categoryLabel(p.category)} · {new Date(p.created_at).toLocaleDateString('ko-KR')}
                      {p.status !== 'published' && <span className="ml-2 text-yellow-600">[초안]</span>}
                      <span className="ml-2">조회 {p.view_count}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {p.status === 'published' && (
                      <a href={`/blog/${encodeURIComponent(p.slug)}`} target="_blank" rel="noopener noreferrer" title="공개 페이지 보기">
                        <ExternalLink size={14} className="text-brand-grey hover:text-brand-deep transition-colors" />
                      </a>
                    )}
                    <button onClick={() => quickUpdate(p, { is_featured: !p.is_featured })} title={p.is_featured ? '홈 노출 해제' : '홈 노출'}>
                      <Star size={14} className={p.is_featured ? 'text-brand-amber fill-brand-amber' : 'text-brand-grey hover:text-brand-amber'} />
                    </button>
                    <button onClick={() => quickUpdate(p, { status: p.status === 'published' ? 'draft' : 'published' })}
                      title={p.status === 'published' ? '초안으로 전환' : '발행'}>
                      {p.status === 'published'
                        ? <Eye size={14} className="text-green-500 hover:text-green-700" />
                        : <EyeOff size={14} className="text-brand-grey hover:text-brand-deep" />}
                    </button>
                    <button onClick={() => setEditingId(p.id)} title="수정">
                      <Pencil size={14} className="text-brand-grey hover:text-brand-deep transition-colors" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} title="삭제">
                      <Trash2 size={14} className="text-brand-grey hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
