const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'

// B2B 단체 출강 문의 접수 자동 1차 응답 (담당자 연락 전 즉시 발송 → 이탈 방지)
export function groupRequestReceivedHtml(params: {
  contactName: string
  orgName: string
  region: string
  participantCount: number
  lessonTheme?: string | null
  preferredDate?: string | null
}) {
  const row = (label: string, value: string) => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
      <span style="color:#9D9D9D;font-size:13px;">${label}</span>
      <span style="color:#292929;font-size:13px;font-weight:500;">${value}</span>
    </div>`
  return `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head>
<body style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;background:#F3F4F7;margin:0;padding:20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1A1A2E;padding:30px 24px;">
      <div style="color:#F59E0B;font-size:12px;font-weight:700;letter-spacing:2px;margin-bottom:8px;">AUTHENTIC ART</div>
      <h1 style="color:#fff;font-size:20px;margin:0;">단체 출강 문의가 접수되었습니다</h1>
    </div>
    <div style="padding:28px 24px;">
      <p style="color:#292929;font-size:15px;margin:0 0 8px;">${params.contactName}님, 안녕하세요.</p>
      <p style="color:#5b5b5b;font-size:14px;line-height:1.7;margin:0 0 20px;">
        <strong>${params.orgName}</strong>의 단체 공예 체험 문의를 정상적으로 접수했습니다.
        담당자가 <strong>영업일 기준 1~2일 내</strong>에 연락드려 상세 상담과 맞춤 견적을 안내드립니다.
      </p>
      <div style="background:#F7F7F5;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
        ${row('기관/회사', params.orgName)}
        ${row('지역', params.region)}
        ${row('예상 인원', `${params.participantCount}명`)}
        ${params.lessonTheme ? row('희망 장르', params.lessonTheme) : ''}
        ${params.preferredDate ? row('희망 일정', params.preferredDate) : ''}
      </div>
      <p style="color:#292929;font-size:14px;font-weight:600;margin:0 0 10px;">진행 절차</p>
      <ol style="color:#5b5b5b;font-size:13px;line-height:1.8;margin:0 0 20px;padding-left:18px;">
        <li>문의 접수 (완료)</li>
        <li>담당자 상담 및 맞춤 견적 안내</li>
        <li>장르·일정 확정 및 인증 강사 매칭</li>
        <li>현장 출강 진행</li>
      </ol>
      <p style="color:#9D9D9D;font-size:12px;line-height:1.6;margin:0;">
        * 비용은 인원·장르·진행 시간·장소에 따라 달라지며, 상담을 통해 안내됩니다.<br>
        문의: 본 메일에 회신하시거나 <a href="${SITE}/group-request" style="color:#1A1A2E;">단체 출강 페이지</a>를 참고하세요.
      </p>
    </div>
  </div>
</body></html>`
}
