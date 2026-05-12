import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import NotificationList from './NotificationList'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Hexagon color="deep" size={16} />
          <h1 className="text-2xl font-bold text-brand-ink">알림</h1>
        </div>
        <NotificationList initialNotifications={notifications ?? []} />
      </div>
    </div>
  )
}
