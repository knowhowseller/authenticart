export function waitlistNotifiedHtml(params: {
  userName: string
  className: string
  startAt: string
  bookingUrl: string
  expiresAt: string
}) {
  const startDate = new Date(params.startAt).toLocaleString('ko-KR')
  const expiresDate = new Date(params.expiresAt).toLocaleString('ko-KR')

  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Apple SD Gothic Neo', sans-serif; background: #F3F4F7; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #1F4145; padding: 32px 24px; text-align: center;">
      <div style="color: #FFBF00; font-size: 13px; font-weight: 600; letter-spacing: 2px; margin-bottom: 8px;">AUTHENTICART</div>
      <h1 style="color: white; font-size: 20px; margin: 0;">대기 순서가 되었습니다!</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="color: #292929; font-size: 15px; margin: 0 0 8px;">${params.userName}님,</p>
      <p style="color: #292929; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
        기다리시던 클래스에 자리가 생겼습니다.<br />
        <strong style="color: #FFBF00;">24시간 이내</strong>에 예약을 완료해주세요.
      </p>
      <div style="background: #F3F4F7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="margin-bottom: 12px;">
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">클래스</div>
          <div style="color: #292929; font-size: 15px; font-weight: 600;">${params.className}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 4px;">일시</div>
          <div style="color: #292929; font-size: 14px;">${startDate}</div>
        </div>
        <div style="padding: 12px; background: #fff8e1; border-radius: 8px; border-left: 3px solid #FFBF00;">
          <div style="color: #9D9D9D; font-size: 12px; margin-bottom: 2px;">예약 마감</div>
          <div style="color: #1F4145; font-size: 14px; font-weight: 700;">${expiresDate}</div>
        </div>
      </div>
      <a href="${params.bookingUrl}"
         style="display: block; background: #FFBF00; color: #292929; text-decoration: none; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 15px;">
        지금 바로 예약하기 →
      </a>
      <p style="color: #9D9D9D; font-size: 12px; text-align: center; margin-top: 16px;">
        시간 내 예약하지 않으면 다음 대기자에게 순서가 넘어갑니다.
      </p>
    </div>
    <div style="padding: 16px 24px; border-top: 1px solid #F3F4F7; text-align: center;">
      <p style="color: #9D9D9D; font-size: 11px; margin: 0;">오센틱아트 · authenticart.kr</p>
    </div>
  </div>
</body>
</html>`
}
