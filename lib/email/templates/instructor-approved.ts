export function instructorApprovedHtml(params: { name: string }) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Apple SD Gothic Neo', sans-serif; background: #F3F4F7; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #1F4145; padding: 32px 24px; text-align: center;">
      <div style="color: #FFBF00; font-size: 13px; font-weight: 600; letter-spacing: 2px; margin-bottom: 8px;">AUTHENTICART</div>
      <h1 style="color: white; font-size: 20px; margin: 0;">강사 승인이 완료되었습니다</h1>
    </div>
    <div style="padding: 32px 24px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px;">🎨</div>
      <p style="color: #292929; font-size: 16px; font-weight: 600; margin: 0 0 8px;">${params.name}님, 환영합니다!</p>
      <p style="color: #9D9D9D; font-size: 14px; margin: 0 0 32px;">오센틱아트 강사로 승인되었습니다.<br>지금 바로 클래스를 등록해 보세요.</p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/studio/classes/new"
         style="display: inline-block; background: #FFBF00; color: #292929; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px;">
        첫 클래스 등록하기
      </a>
    </div>
  </div>
</body>
</html>`
}

export function instructorRejectedHtml(params: { name: string; reason?: string }) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Apple SD Gothic Neo', sans-serif; background: #F3F4F7; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #1F4145; padding: 32px 24px; text-align: center;">
      <div style="color: #FFBF00; font-size: 13px; font-weight: 600; letter-spacing: 2px; margin-bottom: 8px;">AUTHENTICART</div>
      <h1 style="color: white; font-size: 20px; margin: 0;">강사 신청 검토 결과</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="color: #292929; font-size: 15px; margin: 0 0 16px;">${params.name}님,</p>
      <p style="color: #292929; font-size: 14px; margin: 0 0 24px;">강사 신청을 검토한 결과, 이번에는 승인이 어렵게 되었습니다.<br>향후 재신청을 환영합니다.</p>
      ${params.reason ? `<div style="background: #F3F4F7; border-radius: 12px; padding: 16px; margin-bottom: 24px;"><p style="color: #9D9D9D; font-size: 12px; margin: 0 0 4px;">사유</p><p style="color: #292929; font-size: 14px; margin: 0;">${params.reason}</p></div>` : ''}
      <p style="color: #9D9D9D; font-size: 12px;">문의사항은 support@authenticart.kr로 연락해 주세요.</p>
    </div>
  </div>
</body>
</html>`
}
