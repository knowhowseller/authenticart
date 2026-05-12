'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  instructor_id: string
  bio: string | null
  region: string | null
  is_featured: boolean
  approved_at: string | null
  users: { name: string; email: string } | null
}

export default function InstructorFeatureList({ profiles: initial }: { profiles: Profile[] }) {
  const [list, setList] = useState(initial)

  async function toggleFeatured(instructorId: string, current: boolean) {
    const res = await fetch('/api/admin/instructors/feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructor_id: instructorId, is_featured: !current }),
    })
    if (!res.ok) { toast.error('변경 실패'); return }
    setList(prev => prev.map(p =>
      p.instructor_id === instructorId ? { ...p, is_featured: !current } : p
    ))
    toast.success(!current ? '강사소개에 노출됩니다' : '강사소개에서 숨김 처리됩니다')
  }

  if (list.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
      {list.map((p, i) => (
        <div
          key={p.instructor_id}
          className={`flex items-center justify-between px-5 py-4 gap-4 ${i > 0 ? 'border-t border-brand-mist/20' : ''} ${!p.is_featured ? 'opacity-60' : ''}`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-brand-ink">{p.users?.name ?? '이름 없음'}</p>
              <span className="text-xs text-brand-grey">{p.users?.email}</span>
              {!p.is_featured && (
                <span className="text-[10px] bg-brand-bg text-brand-grey px-2 py-0.5 rounded-full">숨김</span>
              )}
            </div>
            {p.region && <p className="text-xs text-brand-grey mt-0.5">{p.region}</p>}
            {p.bio && <p className="text-xs text-brand-grey/70 mt-0.5 line-clamp-1">{p.bio}</p>}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => toggleFeatured(p.instructor_id, p.is_featured)}
              title={p.is_featured ? '강사소개에서 숨기기' : '강사소개에 노출하기'}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={p.is_featured
                ? { borderColor: '#4ade80', color: '#16a34a', background: '#f0fdf4' }
                : { borderColor: '#d1d5db', color: '#6b7280', background: 'white' }
              }
            >
              {p.is_featured
                ? <><Eye size={12} /> 노출 중</>
                : <><EyeOff size={12} /> 숨김</>
              }
            </button>
            <Link
              href={`/admin/instructors/${p.instructor_id}/edit`}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-mist text-brand-grey hover:bg-brand-bg transition-colors"
            >
              편집
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
