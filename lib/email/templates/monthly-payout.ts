import { formatPrice } from '@/lib/utils/format'

export function monthlyPayoutHtml(params: {
  instructorName: string
  year: number
  month: number
  totalGross: number
  totalPgFee: number
  totalPlatformFee: number
  totalPayout: number
  bookingCount: number
}) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Apple SD Gothic Neo', sans-serif; background: #F3F4F7; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #1F4145; padding: 32px 24px; text-align: center;">
      <div style="color: #FFBF00; font-size: 13px; font-weight: 600; letter-spacing: 2px; margin-bottom: 8px;">AUTHENTICART</div>
      <h1 style="color: white; font-size: 20px; margin: 0;">${params.year}년 ${params.month}월 정산 완료</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="color: #292929; font-size: 15px; margin: 0 0 24px;">${params.instructorName} 강사님, 이번 달 정산이 입금되었습니다.</p>
      <div style="background: #F3F4F7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #9D9D9D; font-size: 13px;">총 매출 (${params.bookingCount}건)</span>
          <span style="color: #292929; font-size: 13px;">${formatPrice(params.totalGross)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #9D9D9D; font-size: 13px;">PG 수수료 (3.3%)</span>
          <span style="color: #292929; font-size: 13px;">-${formatPrice(params.totalPgFee)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
          <span style="color: #9D9D9D; font-size: 13px;">플랫폼 수수료 (10%)</span>
          <span style="color: #292929; font-size: 13px;">-${formatPrice(params.totalPlatformFee)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 16px; border-top: 1px solid #BEC9C9;">
          <span style="color: #292929; font-size: 15px; font-weight: 600;">정산액</span>
          <span style="color: #1F4145; font-size: 18px; font-weight: 700;">${formatPrice(params.totalPayout)}</span>
        </div>
      </div>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/studio/payouts"
         style="display: block; background: #1F4145; color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 14px;">
        정산 내역 확인하기
      </a>
    </div>
  </div>
</body>
</html>`
}
