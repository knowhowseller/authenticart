'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, Eye, EyeOff, Trash2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface Notice {
  id: string
  title: string
  is_pinned: boolean
  is_published: boolean
  created_at: string
}

interface FormState { title: string; content: string; is_pinned: boolean; is_published: boolean }
const emptyForm: FormState = { title: '', content: '', is_pinned: false, is_published: true }

export default function NoticesManager({ notices: initial }: { notices: Notice[] }) {
  const [notices, setNotices] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    if (!form.title.trim() || !form.content.trim()) { toast.error('제목과 내용을 입력해주세요'); return }
    setSaving(true)
    const res = await fetch('/api/admin/notices/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) { toast.error('저장 실패'); return }
    toast.success('공지사항이 등록되었습니다')
    setShowForm(false)
    setForm(emptyForm)
    router.refresh()
  }

  async function togglePublish(notice: Notice) {
    const res = await fetch('/api/admin/notices/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notice.id, is_published: !notice.is_published }),
    })
    if (!res.ok) { toast.error('업데이트 실패'); return }
    setNotices(prev => prev.map(n => n.id === notice.id ? { ...n, is_published: !n.is_published } : n))
  }

  async function togglePin(notice: Notice) {
    const res = await fetch('/api/admin/notices/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notice.id, is_pinned: !notice.is_pinned }),
    })
    if (!res.ok) { toast.error('업데이트 실패'); return }
    setNotices(prev => prev.map(n => n.id === notice.id ? { ...n, is_pinned: !n.is_pinned } : n))
  }

  async function handleDelete(id: string) {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return
    const res = await fetch('/api/admin/notices/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { toast.error('삭제 실패'); return }
    toast.success('삭제되었습니다')
    setNotices(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div>
      {/* 작성 폼 */}
      {showForm ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-brand-ink">새 공지사항</p>
            <button onClick={() => { setShowForm(false); setForm(emptyForm) }}>
              <X size={16} className="text-brand-grey" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="제목"
              className="w-full px-4 py-2.5 rounded-xl border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber text-sm"
            />
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="내용"
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-mist focus:outline-none focus:ring-2 focus:ring-brand-amber text-sm resize-none"
            />
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-brand-grey cursor-pointer">
                <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} />
                상단 고정
              </label>
              <label className="flex items-center gap-2 text-sm text-brand-grey cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
                즉시 공개
              </label>
            </div>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="bg-brand-deep text-white text-sm font-medium px-5 py-2 rounded-full disabled:opacity-50"
            >
              {saving ? '저장 중...' : '등록'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-deep text-white text-sm font-medium px-4 py-2 rounded-full mb-4 hover:bg-brand-deep/90"
        >
          <Plus size={14} />
          새 공지사항
        </button>
      )}

      {notices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
          <p className="text-brand-grey">등록된 공지사항이 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
          {notices.map((n, i) => (
            <div
              key={n.id}
              className={`flex items-center justify-between px-5 py-4 gap-4 ${i > 0 ? 'border-t border-brand-mist/20' : ''} ${!n.is_published ? 'opacity-50' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {n.is_pinned && <Pin size={11} className="text-brand-deep flex-shrink-0" />}
                  <p className="text-sm font-medium text-brand-ink truncate">{n.title}</p>
                </div>
                <p className="text-xs text-brand-grey mt-0.5">
                  {new Date(n.created_at).toLocaleDateString('ko-KR')}
                  {!n.is_published && <span className="ml-2 text-yellow-600">[비공개]</span>}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={() => togglePin(n)} title={n.is_pinned ? '고정 해제' : '상단 고정'}>
                  <Pin size={14} className={n.is_pinned ? 'text-brand-deep' : 'text-brand-grey hover:text-brand-deep'} />
                </button>
                <button onClick={() => togglePublish(n)} title={n.is_published ? '비공개로 전환' : '공개로 전환'}>
                  {n.is_published
                    ? <Eye size={14} className="text-green-500 hover:text-green-700" />
                    : <EyeOff size={14} className="text-brand-grey hover:text-brand-deep" />
                  }
                </button>
                <button onClick={() => handleDelete(n.id)}>
                  <Trash2 size={14} className="text-brand-grey hover:text-red-500 transition-colors" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
