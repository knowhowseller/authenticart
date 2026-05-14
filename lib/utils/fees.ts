const PG_RATE = 0.033
const PLATFORM_RATE = 0.10

export function calcFees(gross: number) {
  const pg_fee = Math.round(gross * PG_RATE)
  const platform_fee = Math.round(gross * PLATFORM_RATE)
  const instructor_payout = gross - pg_fee - platform_fee
  return { pg_fee, platform_fee, instructor_payout }
}

// 에이전시 소속 강사 예약 수수료 계산 (agencyRate: 0~15 숫자, 백분율)
export function calcBookingFees(gross: number, agencyRate: number = 0) {
  const pg_fee = Math.round(gross * PG_RATE)
  const platform_fee = Math.round(gross * PLATFORM_RATE)
  const agency_fee = Math.round(gross * agencyRate / 100)
  const instructor_payout = gross - pg_fee - platform_fee - agency_fee
  return { pg_fee, platform_fee, agency_fee, instructor_payout }
}

export function calcRefundAmount(gross: number, classStartAt: Date): number {
  const now = new Date()
  const diffMs = classStartAt.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays >= 3) return gross
  if (diffDays >= 1) return Math.round(gross * 0.5)
  return 0
}

// 작품 마켓 수수료율 결정
// 50만원 이상 작품: 5% 고정
// 월 200건 이상: 5% / 월 100건 이상: 8% / 기본: 10%
export function calcArtworkRate(price: number, monthlyOrderCount: number): number {
  if (price >= 500_000) return 5
  if (monthlyOrderCount >= 200) return 5
  if (monthlyOrderCount >= 100) return 8
  return 10
}

export function calcArtworkFee(price: number, monthlyOrderCount: number) {
  const rate = calcArtworkRate(price, monthlyOrderCount)
  const commission_amount = Math.round(price * rate / 100)
  const seller_payout = price - commission_amount
  return { rate, commission_amount, seller_payout }
}

// 지부 수수료 배분 (플랫폼 수수료의 30%)
const BRANCH_SHARE_RATE = 0.30

export function calcBranchShare(platformFee: number) {
  const branch_share = Math.round(platformFee * BRANCH_SHARE_RATE)
  const hq_share = platformFee - branch_share
  return { branch_share, hq_share }
}
