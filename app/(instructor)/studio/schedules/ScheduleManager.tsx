'use client'
import { useState } from 'react'
import { toast } from 'sonner'

interface ClassOption { id: string; title: string }
interface Schedule {
  id: string
  start_at: string
  end_at: string | null
  max_students: number
  booked_count: number
  classes: any
}

export default function ScheduleManager({
  classes,
  schedules: initial,
}: {
  classes: ClassOption[]
  schedules: Schedule[]
}) {
  const [schedules, setSchedules] = useState(initial)
  const [classId, setClassId] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [maxStudents, setMaxStudents] = useState(8)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleAdd() {
    if (!classId || !startAt) {
      toast.error('클래스와 시작 시간을 선택해주세요')
      return
    }
    setLoading(true)
    const res = await fetch('/api/studio/schedules/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_id: classId,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        max_students: maxStudents,
      }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) { toast.error(json.error ?? '등록 실패'); return }
    toast.success('회차가 등록되었습니다')
    setSchedules(prev => [json.schedule, ...prev])
    setStartAt('')
    setEndAt('')
  }

  async function handleDelete(id: string, booked: number) {
    if (booked > 0) {
      toast.error('예약자가 있는 회차는 삭제할 수 없습니다')
      return
    }
    setDeleting(id)
    const res = await fetch('/api/studio/schedules/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule_id: id }),
    })
    setDeleting(null)
    if (!res.ok) { toast.error('삭제 실패'); return }
    toast.success('회차가 삭제되었습니다')
    setSchedules(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* 회차 추가 폼 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
        <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-4">새 회차 추가</h2>
        {classes.length === 0 ? (
          <p className="text-sm text-brand-grey">게시된 클래스가 없습니다. 먼저 클래스를 등록하고 검수를 받으세요.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-brand-ink block mb-1.5">클래스 선택</label>
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
              >
                <option value="">선택</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">시작 일시 <span className="text-brand-amber">*</span></label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={e => setStartAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink block mb-1.5">종료 일시</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={e => setEndAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-brand-ink block mb-1.5">최대 정원</label>
              <input
                type="number"
                value={maxStudents}
                onChange={e => setMaxStudents(Number(e.target.value))}
                min={1} max={50}
                className="w-40 px-3.5 py-2.5 rounded-lg border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-brand-deep text-white hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
            >
              {loading ? '등록 중...' : '회차 추가'}
            </button>
          </div>
        )}
      </div>

      {/* 예정 회차 목록 */}
      <div>
        <h2 className="text-sm font-semibold text-brand-ink mb-3">예정 회차 ({schedules.length})</h2>
        {schedules.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-brand-mist/30">
            <p className="text-brand-grey text-sm">예정된 회차가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-brand-ink text-sm">{s.classes?.title ?? '-'}</p>
                  <p className="text-xs text-brand-grey mt-0.5">
                    {new Date(s.start_at).toLocaleString('ko-KR')}
                    {s.end_at && ` ~ ${new Date(s.end_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                  <p className="text-xs text-brand-grey mt-0.5">
                    예약 {s.booked_count} / {s.max_students}명
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(s.id, s.booked_count)}
                  disabled={deleting === s.id || s.booked_count > 0}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting === s.id ? '삭제중' : '삭제'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
