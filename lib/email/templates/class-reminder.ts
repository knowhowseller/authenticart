import { formatDateTime } from '@/lib/utils/format'

export function classReminderHtml(params: {
  userName: string
  className: string
  startAt: string
  locationAddress: string | null
  instructorName: string
  instructorPhone: string | null
  materials: string[]
}) {
  const startDate = formatDateTime(params.startAt)
  const materialsSection = params.materials.length > 0
    ? `<div style="margin-bottom: 12px;">
         <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">준비물</div>
         <div style="color: #292929; font-size: 14px;">${params.materials.join(', ')}</div>
       </div>`
    : ''
  const locationSection = params.locationAddress
    ? `<div style="margin-bottom: 12px;">
         <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">장소</div>
         <div style="color: #292929; font-size: 14px;">${params.locationAddress}</div>
       </div>`
    : ''
  const phoneSection = params.instructorPhone
    ? `<div>
         <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">강사 연락처</div>
         <div style="color: #292929; font-size: 14px;">${params.instructorPhone}</div>
       </div>`
    : ''

  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Apple SD Gothic Neo', sans-serif; background: #F3F4F7; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #1F4145; padding: 32px 24px; text-align: center;">
      <div style="color: #FFBF00; font-size: 13px; font-weight: 600; letter-spacing: 2px; margin-bottom: 8px;">AUTHENTICART</div>
      <h1 style="color: white; font-size: 20px; margin: 0;">내일 클래스가 있습니다</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="color: #292929; font-size: 15px; margin: 0 0 24px;">${params.userName}님, 내일 예약하신 클래스를 안내드립니다.</p>
      <div style="background: #F3F4F7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="margin-bottom: 12px;">
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">클래스</div>
          <div style="color: #292929; font-size: 15px; font-weight: 600;">${params.className}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">일시</div>
          <div style="color: #292929; font-size: 14px;">${startDate}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">강사</div>
          <div style="color: #292929; font-size: 14px;">${params.instructorName}</div>
        </div>
        ${locationSection}
        ${materialsSection}
        ${phoneSection}
      </div>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://authenticart.kr'}/my/bookings"
         style="display: block; background: #1F4145; color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 14px;">
        예약 내역 확인하기
      </a>
    </div>
    <div style="padding: 16px 24px; border-top: 1px solid #F3F4F7; text-align: center;">
      <p style="color: #9D9D9D; font-size: 11px; margin: 0;">오센틱아트 · authenticart.kr</p>
    </div>
  </div>
</body>
</html>`
}
