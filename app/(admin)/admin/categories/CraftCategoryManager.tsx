'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Check, X, Eye, EyeOff } from 'lucide-react'

interface Category {
  id: string
  code: string
  name: string
  name_en: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
}

export default function CraftCategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const supabase = createClient()
  const [categories, setCategories] = useState(initialCategories)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<{ id: string; name: string; name_en: string } | null>(null)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newSub, setNewSub] = useState({ code: '', name: '', name_en: '' })
  const [loading, setLoading] = useState(false)

  const parents = categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order)
  const childrenOf = (parentId: string) =>
    categories.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function toggleActive(cat: Category) {
    const { error } = await supabase
      .from('craft_categories')
      .update({ is_active: !cat.is_active })
      .eq('id', cat.id)
    if (error) { toast.error(error.message); return }
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
    toast.success(`"${cat.name}" ${!cat.is_active ? '활성화' : '비활성화'}`)
  }

  function startEdit(cat: Category) {
    setEditing({ id: cat.id, name: cat.name, name_en: cat.name_en ?? '' })
  }

  async function saveEdit() {
    if (!editing) return
    const trimName = editing.name.trim()
    if (!trimName) { setEditing(null); return }
    setLoading(true)
    const { error } = await supabase
      .from('craft_categories')
      .update({ name: trimName, name_en: editing.name_en.trim() || null })
      .eq('id', editing.id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setCategories(prev => prev.map(c =>
      c.id === editing.id ? { ...c, name: trimName, name_en: editing.name_en.trim() || null } : c
    ))
    toast.success('카테고리 이름이 수정되었습니다')
    setEditing(null)
  }

  async function deleteSub(cat: Category) {
    if (!confirm(`"${cat.name}" 소카테고리를 삭제할까요?\n연결된 클래스·상품의 category_id가 null로 변경됩니다.`)) return
    setLoading(true)
    const { error } = await supabase.from('craft_categories').delete().eq('id', cat.id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setCategories(prev => prev.filter(c => c.id !== cat.id))
    toast.success(`"${cat.name}" 삭제됨`)
  }

  async function addSubcategory(parentId: string) {
    const code = newSub.code.trim()
    const name = newSub.name.trim()
    if (!code || !name) { toast.error('코드와 이름을 입력하세요'); return }

    const siblings = childrenOf(parentId)
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.sort_order)) : 0

    setLoading(true)
    const { data, error } = await supabase
      .from('craft_categories')
      .insert({
        code,
        name,
        name_en: newSub.name_en.trim() || null,
        parent_id: parentId,
        sort_order: maxOrder + 1,
      })
      .select('id, code, name, name_en, parent_id, sort_order, is_active')
      .single()
    setLoading(false)

    if (error) { toast.error(error.message); return }
    setCategories(prev => [...prev, data])
    setNewSub({ code: '', name: '', name_en: '' })
    setAddingTo(null)
    toast.success(`"${name}" 소카테고리 추가됨`)
  }

  return (
    <div className="space-y-3">
      {parents.map(parent => {
        const children = childrenOf(parent.id)
        const isOpen = expanded.has(parent.id)

        return (
          <div key={parent.id}
            className="bg-white rounded-2xl border border-brand-mist/30 shadow-sm overflow-hidden"
          >
            {/* 대카테고리 행 */}
            <div className="flex items-center gap-3 px-5 py-4">
              <button
                onClick={() => toggleExpand(parent.id)}
                className="text-brand-grey hover:text-brand-ink transition-colors"
              >
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              <div className="flex-1 min-w-0">
                {editing?.id === parent.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editing.name}
                      onChange={e => setEditing({ ...editing, name: e.target.value })}
                      className="text-sm font-semibold text-brand-ink border-b border-brand-amber outline-none bg-transparent w-32"
                      autoFocus
                    />
                    <input
                      value={editing.name_en}
                      onChange={e => setEditing({ ...editing, name_en: e.target.value })}
                      placeholder="English"
                      className="text-xs text-brand-grey border-b border-brand-mist outline-none bg-transparent w-28"
                    />
                    <button onClick={saveEdit} disabled={loading} className="text-green-500 hover:text-green-600"><Check size={13} /></button>
                    <button onClick={() => setEditing(null)} className="text-brand-grey hover:text-brand-ink"><X size={13} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${parent.is_active ? 'text-brand-ink' : 'text-brand-grey line-through'}`}>
                      {parent.name}
                    </span>
                    {parent.name_en && (
                      <span className="text-xs text-brand-grey hidden sm:inline">{parent.name_en}</span>
                    )}
                    <span className="text-xs text-brand-mist font-mono hidden sm:inline">{parent.code}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-brand-grey">
                <span>{children.length}개 소카테고리</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActive(parent)}
                  title={parent.is_active ? '비활성화' : '활성화'}
                  className={`p-1.5 rounded-lg transition-colors ${parent.is_active ? 'text-green-500 hover:bg-green-50' : 'text-brand-grey hover:bg-brand-bg'}`}
                >
                  {parent.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                {editing?.id !== parent.id && (
                  <button
                    onClick={() => startEdit(parent)}
                    className="p-1.5 rounded-lg text-brand-grey hover:text-brand-deep hover:bg-brand-bg transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* 소카테고리 목록 */}
            {isOpen && (
              <div className="border-t border-brand-mist/20 bg-brand-bg/40">
                {children.map(child => (
                  <div key={child.id}
                    className="flex items-center gap-3 px-8 py-2.5 border-b border-brand-mist/10 last:border-b-0 hover:bg-white/60 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-mist flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      {editing?.id === child.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editing.name}
                            onChange={e => setEditing({ ...editing, name: e.target.value })}
                            className="text-xs font-medium text-brand-ink border-b border-brand-amber outline-none bg-transparent w-28"
                            autoFocus
                          />
                          <input
                            value={editing.name_en}
                            onChange={e => setEditing({ ...editing, name_en: e.target.value })}
                            placeholder="English"
                            className="text-xs text-brand-grey border-b border-brand-mist outline-none bg-transparent w-24"
                          />
                          <button onClick={saveEdit} disabled={loading} className="text-green-500"><Check size={12} /></button>
                          <button onClick={() => setEditing(null)} className="text-brand-grey"><X size={12} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${child.is_active ? 'text-brand-ink' : 'text-brand-grey line-through'}`}>
                            {child.name}
                          </span>
                          {child.name_en && (
                            <span className="text-xs text-brand-grey hidden sm:inline">{child.name_en}</span>
                          )}
                          <span className="text-xs text-brand-mist font-mono hidden sm:inline">{child.code}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => toggleActive(child)}
                        className={`p-1 rounded transition-colors ${child.is_active ? 'text-green-500 hover:bg-green-50' : 'text-brand-grey hover:bg-white'}`}
                      >
                        {child.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      {editing?.id !== child.id && (
                        <button
                          onClick={() => startEdit(child)}
                          className="p-1 rounded text-brand-grey hover:text-brand-deep hover:bg-white transition-colors"
                        >
                          <Pencil size={11} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteSub(child)}
                        disabled={loading}
                        className="p-1 rounded text-brand-grey hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* 소카테고리 추가 폼 */}
                {addingTo === parent.id ? (
                  <div className="flex items-center gap-2 px-8 py-3 bg-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-amber flex-shrink-0" />
                    <input
                      value={newSub.code}
                      onChange={e => setNewSub(p => ({ ...p, code: e.target.value }))}
                      placeholder="코드 (예: resin_new)"
                      className="text-xs px-2 py-1 rounded border border-brand-mist focus:outline-none focus:ring-1 focus:ring-brand-amber w-36"
                    />
                    <input
                      value={newSub.name}
                      onChange={e => setNewSub(p => ({ ...p, name: e.target.value }))}
                      placeholder="이름 (예: 신규소카테고리)"
                      className="text-xs px-2 py-1 rounded border border-brand-mist focus:outline-none focus:ring-1 focus:ring-brand-amber w-32"
                      onKeyDown={e => e.key === 'Enter' && addSubcategory(parent.id)}
                    />
                    <input
                      value={newSub.name_en}
                      onChange={e => setNewSub(p => ({ ...p, name_en: e.target.value }))}
                      placeholder="English (선택)"
                      className="text-xs px-2 py-1 rounded border border-brand-mist focus:outline-none w-28 hidden sm:block"
                    />
                    <button
                      onClick={() => addSubcategory(parent.id)}
                      disabled={loading}
                      className="text-xs px-2.5 py-1 rounded bg-brand-deep text-white hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
                    >
                      추가
                    </button>
                    <button
                      onClick={() => { setAddingTo(null); setNewSub({ code: '', name: '', name_en: '' }) }}
                      className="text-brand-grey hover:text-brand-ink"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingTo(parent.id); setExpanded(prev => new Set([...prev, parent.id])) }}
                    className="flex items-center gap-2 px-8 py-2.5 w-full text-xs text-brand-grey hover:text-brand-deep hover:bg-white/60 transition-colors"
                  >
                    <Plus size={12} />
                    소카테고리 추가
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      <p className="text-xs text-brand-grey text-center pt-2">
        대카테고리 8개는 플랫폼 핵심 장르입니다. 삭제하지 말고 비활성화로 관리하세요.
      </p>
    </div>
  )
}
