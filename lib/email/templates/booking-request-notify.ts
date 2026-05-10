export function bookingRequestNotifyHtml(params: {
  instructorName: string
  studentName: string
  className: string
  startAt: string
  bookingId: string
}) {
  const startDate = new Date(params.startAt).toLocaleString('ko-KR')
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Apple SD Gothic Neo', sans-serif; background: #F3F4F7; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #1F4145; padding: 32px 24px; text-align: center;">
      <div style="color: #FFBF00; font-size: 13px; font-weight: 600; letter-spacing: 2px; margin-bottom: 8px;">AUTHENTICART</div>
      <h1 style="color: white; font-size: 20px; margin: 0;">새 예약 신청이 도착했습니다</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="color: #292929; font-size: 15px; margin: 0 0 24px;">${params.instructorName} 강사님, 새 예약 신청이 접수되었습니다.<br>24시간 내에 승인 또는 거절해 주세요.</p>
      <div style="background: #F3F4F7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="margin-bottom: 12px;">
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">클래스</div>
          <div style="color: #292929; font-size: 15px; font-weight: 600;">${params.className}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">일시</div>
          <div style="color: #292929; font-size: 14px;">${startDate}</div>
        </div>
        <div>
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">신청자</div>
          <div style="color: #292929; font-size: 14px;">${params.studentName}</div>
        </div>
      </div>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/studio/requests"
         style="display: block; background: #FFBF00; color: #292929; text-decoration: none; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 14px;">
        신청 확인 및 처리하기
      </a>
    </div>
  </div>
</body>
</html>`
}
