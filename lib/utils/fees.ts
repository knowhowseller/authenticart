const PG_RATE = 0.033
const PLATFORM_RATE = 0.10

export function calcFees(gross: number) {
  const pg_fee = Math.round(gross * PG_RATE)
  const platform_fee = Math.round(gross * PLATFORM_RATE)
  const instructor_payout = gross - pg_fee - platform_fee
  return { pg_fee, platform_fee, instructor_payout }
}

export function calcRefundAmount(gross: number, classStartAt: Date): number {
  const now = new Date()
  const diffMs = classStartAt.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays >= 7) return gross          // 100%
  if (diffDays >= 3) return Math.round(gross * 0.5)  // 50%
  return 0                                 // 0%
}
