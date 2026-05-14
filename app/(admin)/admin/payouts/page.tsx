import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import PayoutProcessList from './PayoutProcessList'
import VendorPayoutList from './VendorPayoutList'
import AgencyPayoutList from './AgencyPayoutList'
import BranchPayoutList from './BranchPayoutList'
import TriggerPayoutButton from './TriggerPayoutButton'

export const metadata = { title: '정산 관리 | Admin' }

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'branch_manager'].includes(u?.role ?? '')) redirect('/')

  const { tab } = await searchParams
  const activeTab = tab ?? 'instructor'
  const isAdmin = u?.role === 'admin'

  // 강사 정산
  const [instructorPending, instructorPaid] = await Promise.all([
    supabase.from('payouts')
      .select('*, users!instructor_id(name, email), instructor_profiles!instructor_id(payout_account)')
      .eq('status', 'pending').order('period_year', { ascending: false }).order('period_month', { ascending: false })
      .then(r => r.data ?? []),
    supabase.from('payouts')
      .select('*, users!instructor_id(name, email), instructor_profiles!instructor_id(payout_account)')
      .eq('status', 'paid').order('paid_at', { ascending: false }).limit(20)
      .then(r => r.data ?? []),
  ])

  // 벤더 정산
  const [vendorPending, vendorPaid] = isAdmin ? await Promise.all([
    supabase.from('vendor_payouts')
      .select('*, vendors!vendor_id(business_name, contact_email, payout_account)')
      .eq('status', 'pending').order('period_year', { ascending: false })
      .then(r => r.data ?? []),
    supabase.from('vendor_payouts')
      .select('*, vendors!vendor_id(business_name, contact_email, payout_account)')
      .eq('status', 'paid').order('paid_at', { ascending: false }).limit(20)
      .then(r => r.data ?? []),
  ]) : [[], []]

  // 에이전시 정산
  const [agencyPending, agencyPaid] = isAdmin ? await Promise.all([
    supabase.from('agency_payouts')
      .select('*, agencies!agency_id(agency_name, contact_email, payout_account)')
      .eq('status', 'pending').order('period_year', { ascending: false })
      .then(r => r.data ?? []),
    supabase.from('agency_payouts')
      .select('*, agencies!agency_id(agency_name, contact_email, payout_account)')
      .eq('status', 'paid').order('paid_at', { ascending: false }).limit(20)
      .then(r => r.data ?? []),
  ]) : [[], []]

  // 지부 정산
  const [branchPending, branchPaid] = await Promise.all([
    supabase.from('branch_payouts')
      .select('*, branches!branch_id(name, manager_id)')
      .eq('status', 'pending').order('period_year', { ascending: false })
      .then(r => r.data ?? []),
    supabase.from('branch_payouts')
      .select('*, branches!branch_id(name, manager_id)')
      .eq('status', 'paid').order('paid_at', { ascending: false }).limit(20)
      .then(r => r.data ?? []),
  ])

  const tabs = [
    { key: 'instructor', label: '강사 정산', badge: instructorPending.length, show: true },
    { key: 'vendor', label: '벤더 정산', badge: vendorPending.length, show: isAdmin },
    { key: 'agency', label: '에이전시 정산', badge: agencyPending.length, show: isAdmin },
    { key: 'branch', label: '지부 정산', badge: branchPending.length, show: true },
  ].filter(t => t.show)

  const totalPending =
    instructorPending.reduce((s: number, p: any) => s + p.total_payout, 0) +
    vendorPending.reduce((s: number, p: any) => s + p.payout_amount, 0) +
    agencyPending.reduce((s: number, p: any) => s + p.agency_fee, 0) +
    branchPending.reduce((s: number, p: any) => s + p.branch_share, 0)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">정산 관리</h1>
            <p className="text-sm text-brand-grey mt-1">전체 대기 정산액 <strong className="text-brand-deep">{formatPrice(totalPending)}</strong></p>
          </div>
          {isAdmin && <TriggerPayoutButton />}
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-brand-mist/30 w-fit">
          {tabs.map(t => (
            <Link
              key={t.key}
              href={`/admin/payouts?tab=${t.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.key
                  ? 'bg-brand-deep text-white shadow-sm'
                  : 'text-brand-grey hover:text-brand-ink'
              }`}
            >
              {t.label}
              {t.badge > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === t.key ? 'bg-white/20' : 'bg-red-500 text-white'
                }`}>
                  {t.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {activeTab === 'instructor' && (
          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold text-brand-ink mb-4">
                정산 대기 <span className="text-brand-grey font-normal">{instructorPending.length}건</span>
              </p>
              <PayoutProcessList payouts={instructorPending as any} mode="pending" />
            </div>
            {instructorPaid.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-brand-ink mb-4">최근 입금 완료</p>
                <PayoutProcessList payouts={instructorPaid as any} mode="paid" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'vendor' && (
          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold text-brand-ink mb-4">
                정산 대기 <span className="text-brand-grey font-normal">{vendorPending.length}건</span>
              </p>
              <VendorPayoutList payouts={vendorPending as any} mode="pending" />
            </div>
            {vendorPaid.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-brand-ink mb-4">최근 입금 완료</p>
                <VendorPayoutList payouts={vendorPaid as any} mode="paid" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'agency' && (
          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold text-brand-ink mb-4">
                정산 대기 <span className="text-brand-grey font-normal">{agencyPending.length}건</span>
              </p>
              <AgencyPayoutList payouts={agencyPending as any} mode="pending" />
            </div>
            {agencyPaid.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-brand-ink mb-4">최근 입금 완료</p>
                <AgencyPayoutList payouts={agencyPaid as any} mode="paid" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'branch' && (
          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold text-brand-ink mb-4">
                정산 대기 <span className="text-brand-grey font-normal">{branchPending.length}건</span>
              </p>
              <BranchPayoutList payouts={branchPending as any} mode="pending" />
            </div>
            {branchPaid.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-brand-ink mb-4">최근 입금 완료</p>
                <BranchPayoutList payouts={branchPaid as any} mode="paid" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
