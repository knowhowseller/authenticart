import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'

export default async function InstructorsPage() {
  const supabase = await createClient()

  const { data: instructors } = await supabase
    .from('instructor_profiles')
    .select(`
      instructor_id, bio, region, status,
      users!instructor_id(name)
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Instructors</span>
        </div>
        <h1 className="text-3xl font-bold text-brand-ink mb-2">강사 소개</h1>
        <p className="text-brand-grey mb-10">오센틱아트의 공예 전문 강사들을 만나보세요</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(instructors ?? []).map((i: any) => (
            <Link
              key={i.instructor_id}
              href={`/instructors/${i.instructor_id}`}
              className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 hover:shadow-md hover:border-brand-amber/30 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-blush to-brand-mist flex items-center justify-center mb-3">
                <span className="text-2xl">👩‍🎨</span>
              </div>
              <h3 className="font-semibold text-brand-ink text-sm">{i.users?.name}</h3>
              {i.region && <p className="text-xs text-brand-grey mt-0.5">{i.region}</p>}
              {i.bio && (
                <p className="text-xs text-brand-grey mt-2 line-clamp-2">{i.bio}</p>
              )}
            </Link>
          ))}
          {(!instructors || instructors.length === 0) && (
            <div className="col-span-full text-center py-12 text-brand-grey">
              등록된 강사가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
