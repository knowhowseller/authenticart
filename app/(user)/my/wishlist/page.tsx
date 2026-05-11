import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ClassCard from '@/components/class/ClassCard'
import type { ClassAttributes, ConfirmationMode } from '@/types/database'

async function getWishlist(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('wishlists')
    .select(`
      id, class_id,
      classes!class_id(
        id, title, region, price, thumbnail_url, confirmation_mode, attributes,
        users!instructor_id(name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wishlist = await getWishlist(user.id)
  const wishlistedIds = new Set(wishlist.map((w: any) => w.class_id))

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-ink mb-1">찜한 클래스</h1>
        <p className="text-brand-grey text-sm mb-6">관심 있는 클래스를 모아두었어요</p>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {wishlist.map((w: any) => {
              const cls = w.classes
              if (!cls) return null
              return (
                <ClassCard
                  key={w.id}
                  id={cls.id}
                  title={cls.title}
                  instructorName={cls.users?.name ?? '강사'}
                  region={cls.region}
                  price={cls.price}
                  thumbnail_url={cls.thumbnail_url}
                  confirmation_mode={cls.confirmation_mode as ConfirmationMode}
                  attributes={cls.attributes as ClassAttributes}
                  wishlisted={wishlistedIds.has(cls.id)}
                />
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">🤍</div>
            <p className="text-brand-grey font-medium">찜한 클래스가 없습니다</p>
            <p className="text-sm text-brand-grey mt-1">관심 있는 클래스에 하트를 눌러보세요</p>
            <Link href="/classes" className="inline-block mt-4 text-sm text-brand-deep hover:underline">
              클래스 둘러보기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
