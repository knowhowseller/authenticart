import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import ClassCard from '@/components/class/ClassCard'

export default async function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('instructor_profiles')
    .select('*, users!instructor_id(name, email)')
    .eq('instructor_id', id)
    .eq('status', 'approved')
    .single()

  if (!profile) notFound()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, title, region, price, status, attributes, confirmation_mode, thumbnail_url')
    .eq('instructor_id', id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-mist/30 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-blush to-brand-mist flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">👩‍🎨</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Hexagon color="amber" size={14} />
                <span className="text-xs text-brand-amber font-medium uppercase tracking-wider">강사</span>
              </div>
              <h1 className="text-2xl font-bold text-brand-ink">{(profile as any).users?.name}</h1>
              {profile.region && <p className="text-brand-grey text-sm mt-0.5">{profile.region}</p>}
              {profile.bio && (
                <p className="text-brand-ink/80 text-sm mt-3 whitespace-pre-line leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {classes && classes.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-brand-ink mb-4">개설 클래스</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {classes.map((cls: any) => (
                <ClassCard
                  key={cls.id}
                  id={cls.id}
                  title={cls.title}
                  region={cls.region}
                  price={cls.price}
                  thumbnail_url={cls.thumbnail_url ?? null}
                  instructorName={(profile as any).users?.name ?? ''}
                  confirmation_mode={cls.confirmation_mode}
                  attributes={cls.attributes ?? {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
