import { formatPrice } from '@/lib/utils/format'

export function refundCompleteHtml(params: {
  userName: string
  className: string
  refundAmount: number
  originalAmount: number
}) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Apple SD Gothic Neo', sans-serif; background: #F3F4F7; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #1F4145; padding: 32px 24px; text-align: center;">
      <div style="color: #FFBF00; font-size: 13px; font-weight: 600; letter-spacing: 2px; margin-bottom: 8px;">AUTHENTICART</div>
      <h1 style="color: white; font-size: 20px; margin: 0;">환불이 처리되었습니다</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="color: #292929; font-size: 15px; margin: 0 0 24px;">${params.userName}님, 환불 처리가 완료되었습니다.</p>
      <div style="background: #F3F4F7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="margin-bottom: 12px;">
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">클래스</div>
          <div style="color: #292929; font-size: 14px;">${params.className}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">원 결제 금액</div>
          <div style="color: #292929; font-size: 14px;">${formatPrice(params.originalAmount)}</div>
        </div>
        <div>
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">환불 금액</div>
          <div style="color: #1F4145; font-size: 16px; font-weight: 700;">${formatPrice(params.refundAmount)}</div>
        </div>
      </div>
      <p style="color: #9D9D9D; font-size: 12px; text-align: center;">영업일 기준 3~5일 내 환불됩니다</p>
    </div>
  </div>
</body>
</html>`
}
