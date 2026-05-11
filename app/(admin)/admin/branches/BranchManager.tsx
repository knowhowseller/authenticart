'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Branch {
  id: string
  name: string
  region: string
  commission_rate: number
  manager_id: string | null
  users: { name: string; email: string } | null
}

interface Manager {
  id: string
  name: string
  email: string
}

export default function BranchManager({
  branches: initial,
  managers,
}: {
  branches: Branch[]
  managers: Manager[]
}) {
  const supabase = createClient()
  const [branches, setBranches] = useState(initial)
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [managerId, setManagerId] = useState('')
  const [commission, setCommission] = useState('0')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim() || !region.trim()) { toast.error('지부명과 지역을 입력해주세요'); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('branches')
      .insert({
        name: name.trim(),
        region: region.trim(),
        manager_id: managerId || null,
        commission_rate: parseFloat(commission) || 0,
      })
      .select('*, users!manager_id(name, email)')
      .single()

    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('지부가 생성되었습니다')
    setBranches(prev => [...prev, data as Branch])
    setName(''); setRegion(''); setManagerId(''); setCommission('0')
  }

  async function handleAssignManager(branchId: string, newManagerId: string) {
    const { error } = await supabase
      .from('branches')
      .update({ manager_id: newManagerId || null })
      .eq('id', branchId)
    if (error) { toast.error(error.message); return }
    toast.success('지부장이 변경되었습니다')
    setBranches(prev => prev.map(b =>
      b.id === branchId
        ? { ...b, manager_id: newManagerId || null, users: managers.find(m => m.id === newManagerId) ? { name: managers.find(m => m.id === newManagerId)!.name, email: managers.find(m => m.id === newManagerId)!.email } : null }
        : b
    ))
  }

  return (
    <div className="space-y-6">
      {/* 지부 생성 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
        <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-4">새 지부 추가</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-brand-ink block mb-1.5">지부명 *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 서울 강남 지부"
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-ink block mb-1.5">담당 지역 *</label>
            <input value={region} onChange={e => setRegion(e.target.value)} placeholder="예: 서울 강남구"
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-ink block mb-1.5">지부장</label>
            <select value={managerId} onChange={e => setManagerId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber">
              <option value="">미지정</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-brand-ink block mb-1.5">지부 커미션율 (%)</label>
            <input type="number" value={commission} onChange={e => setCommission(e.target.value)}
              min="0" max="100" step="0.5"
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber" />
          </div>
        </div>
        <button onClick={handleCreate} disabled={loading}
          className="px-5 py-2.5 text-sm font-medium rounded-xl bg-brand-deep text-white hover:bg-brand-deep/90 disabled:opacity-50 transition-colors">
          {loading ? '생성 중...' : '지부 추가'}
        </button>
      </div>

      {/* 지부 목록 */}
      <div>
        <h2 className="text-sm font-semibold text-brand-ink mb-3">지부 목록 ({branches.length})</h2>
        {branches.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-brand-mist/30">
            <p className="text-brand-grey text-sm">등록된 지부가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map(b => (
              <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-brand-ink">{b.name}</p>
                    <p className="text-xs text-brand-grey mt-0.5">지역: {b.region} · 커미션: {b.commission_rate}%</p>
                    {b.users ? (
                      <p className="text-xs text-brand-deep mt-0.5">지부장: {b.users.name} ({b.users.email})</p>
                    ) : (
                      <p className="text-xs text-orange-500 mt-0.5">⚠️ 지부장 미지정</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <select
                      defaultValue={b.manager_id ?? ''}
                      onChange={e => handleAssignManager(b.id, e.target.value)}
                      className="text-xs border border-brand-mist rounded-lg px-2 py-1.5 focus:outline-none"
                    >
                      <option value="">지부장 변경...</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
