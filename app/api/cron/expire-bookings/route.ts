import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()
  const now = new Date().toISOString()

  // 강사 응답 기한 초과 (pending_approval)
  const { data: expiredApproval } = await admin
    .from('bookings')
    .update({ status: 'expired' })
    .eq('status', 'pending_approval')
    .lt('approval_expires_at', now)
    .select('id')

  // 결제 기한 초과 (approved → student didn't pay in time)
  const { data: expiredPayment } = await admin
    .from('bookings')
    .update({ status: 'expired' })
    .eq('status', 'approved')
    .lt('payment_expires_at', now)
    .select('id')

  return NextResponse.json({
    expired_approval: expiredApproval?.length ?? 0,
    expired_payment: expiredPayment?.length ?? 0,
  })
}
