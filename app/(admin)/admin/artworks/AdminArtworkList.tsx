'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:   { label: '판매 중', color: 'bg-green-50 text-green-600' },
  sold_out: { label: '판매 완료', color: 'bg-brand-bg text-brand-grey' },
  hidden:   { label: '숨김', color: 'bg-red-50 text-red-400' },
}

interface Artwork {
  id: string
  title: string
  price: number
  images: string[]
  category: string
  status: string
  created_at: string
  seller_id: string
  users: { name: string } | null
}

export default function AdminArtworkList({ initialArtworks }: { initialArtworks: Artwork[] }) {
  const [artworks, setArtworks] = useState(initialArtworks)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" 작품을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
    setDeleting(id)
    const res = await fetch(`/api/artworks/${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (!res.ok) { toast.error('삭제 실패'); return }
    toast.success('작품이 삭제되었습니다')
    setArtworks(prev => prev.filter(a => a.id !== id))
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/artworks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error('상태 변경 실패'); return }
    toast.success('상태가 변경되었습니다')
    setArtworks(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const filtered = statusFilter === 'all' ? artworks : artworks.filter(a => a.status === statusFilter)

  return (
    <div>
      {/* 필터 탭 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['all', `전체 (${artworks.length})`], ['active', '판매 중'], ['sold_out', '판매 완료'], ['hidden', '숨김']].map(([v, label]) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${statusFilter === v ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-mist text-brand-grey hover:border-brand-deep'}`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
          <p className="text-brand-grey">작품이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const s = STATUS_LABELS[a.status] ?? STATUS_LABELS.active
            return (
              <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                  {a.images?.[0] ? (
                    <img src={a.images[0]} alt={a.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl opacity-30">🎨</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-brand-ink text-sm truncate">{a.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${s.color}`}>{s.label}</span>
                  </div>
                  <p className="text-xs text-brand-grey">
                    {(a.users as any)?.name} · {a.category} · {a.price.toLocaleString()}원
                    <span className="ml-2 opacity-60">{new Date(a.created_at).toLocaleDateString('ko-KR')}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={a.status}
                    onChange={e => handleStatusChange(a.id, e.target.value)}
                    className="text-xs px-2 py-1.5 rounded-lg border border-brand-mist focus:outline-none focus:ring-1 focus:ring-brand-amber"
                  >
                    <option value="active">판매 중</option>
                    <option value="sold_out">판매 완료</option>
                    <option value="hidden">숨김</option>
                  </select>
                  <button
                    onClick={() => handleDelete(a.id, a.title)}
                    disabled={deleting === a.id}
                    className="p-2 rounded-lg text-brand-grey hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
