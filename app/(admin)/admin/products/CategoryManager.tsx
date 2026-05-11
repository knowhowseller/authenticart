'use client'
import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { manageCategory } from '@/app/actions/admin-products'

export default function CategoryManager({ initial }: { initial: string[] }) {
  const [cats, setCats] = useState(initial)
  const [newCat, setNewCat] = useState('')
  const [editing, setEditing] = useState<{ idx: number; val: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function addCat() {
    const v = newCat.trim()
    if (!v || cats.includes(v)) return
    startTransition(async () => {
      const res = await manageCategory('add', v)
      if (!res.error) { setCats(res.categories!); setNewCat('') }
    })
  }

  function deleteCat(cat: string) {
    if (!confirm(`"${cat}" 카테고리를 삭제할까요?`)) return
    startTransition(async () => {
      const res = await manageCategory('delete', cat)
      if (!res.error) setCats(res.categories!)
    })
  }

  function saveEdit() {
    if (!editing) return
    const v = editing.val.trim()
    if (!v || cats.includes(v)) { setEditing(null); return }
    const old = cats[editing.idx]
    startTransition(async () => {
      const res = await manageCategory('rename', old, v)
      if (!res.error) { setCats(res.categories!); setEditing(null) }
    })
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
      <h2 className="text-sm font-semibold text-brand-ink mb-3">카테고리 관리</h2>

      <div className="flex flex-wrap gap-2 mb-3">
        {cats.map((cat, idx) => (
          <div key={cat} className="flex items-center gap-1 bg-brand-bg rounded-full px-3 py-1 border border-brand-mist/40">
            {editing?.idx === idx ? (
              <>
                <input
                  value={editing.val}
                  onChange={e => setEditing({ idx, val: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(null) }}
                  className="text-xs w-20 bg-transparent outline-none border-b border-brand-amber"
                  autoFocus
                />
                <button onClick={saveEdit} disabled={isPending} className="text-green-500 hover:text-green-600"><Check size={11} /></button>
                <button onClick={() => setEditing(null)} className="text-brand-grey hover:text-brand-ink"><X size={11} /></button>
              </>
            ) : (
              <>
                <span className="text-xs text-brand-ink">{cat}</span>
                <button onClick={() => setEditing({ idx, val: cat })} className="text-brand-grey hover:text-brand-deep ml-1"><Pencil size={10} /></button>
                <button onClick={() => deleteCat(cat)} disabled={isPending} className="text-brand-grey hover:text-red-500"><Trash2 size={10} /></button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCat()}
          placeholder="새 카테고리"
          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-brand-mist focus:outline-none focus:ring-1 focus:ring-brand-amber"
        />
        <button
          onClick={addCat}
          disabled={isPending || !newCat.trim()}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-deep text-white hover:bg-brand-deep/90 disabled:opacity-50 flex items-center gap-1 transition-colors"
        >
          <Plus size={12} /> 추가
        </button>
      </div>
    </div>
  )
}
