import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'
import { MapPin } from 'lucide-react'

export default async function InstructorsPage() {
  const supabase = await createClient()

  const { data: instructors } = await supabase
    .from('instructor_profiles')
    .select('instructor_id, bio, region, status, profile_image, users!instructor_id(name)')
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
          {(instructors ?? []).map((inst: any) => (
            <Link
              key={inst.instructor_id}
              href={`/instructors/${inst.instructor_id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-mist/30 hover:shadow-md hover:border-brand-amber/30 transition-all group"
            >
              {/* 상단 배너 + 아바타 */}
              <div className="relative h-16 bg-gradient-to-r from-brand-deep/10 via-brand-blush/20 to-brand-mist/30">
                <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-xl border-2 border-white shadow-sm overflow-hidden bg-gradient-to-br from-brand-blush to-brand-mist">
                  {inst.profile_image ? (
                    <img src={inst.profile_image} alt={inst.users?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">👩‍🎨</div>
                  )}
                </div>
              </div>

              <div className="pt-8 pb-4 px-4">
                <h3 className="font-semibold text-brand-ink text-sm group-hover:text-brand-deep transition-colors">
                  {inst.users?.name}
                </h3>
                {inst.region && (
                  <div className="flex items-center gap-0.5 text-xs text-brand-grey mt-0.5">
                    <MapPin size={10} />
                    {inst.region}
                  </div>
                )}
                {inst.bio && (
                  <p className="text-xs text-brand-grey mt-2 line-clamp-2 leading-relaxed">{inst.bio}</p>
                )}
              </div>
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
