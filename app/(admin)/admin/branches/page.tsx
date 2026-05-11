import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import BranchManager from './BranchManager'

export default async function AdminBranchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (u?.role !== 'admin') redirect('/')

  const { data: branches } = await supabase
    .from('branches')
    .select('*, users!manager_id(name, email)')
    .order('region')

  const { data: managers } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('role', 'branch_manager')
    .order('name')

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">지부 관리</h1>
        <BranchManager branches={branches ?? []} managers={managers ?? []} />
      </div>
    </div>
  )
}
