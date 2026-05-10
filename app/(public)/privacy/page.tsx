export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-brand-ink mb-2">개인정보처리방침</h1>
        <p className="text-brand-grey text-sm mb-8">최종 수정일: 2026년 5월 1일</p>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 prose prose-sm max-w-none text-brand-ink">
          <h2>1. 개인정보의 처리 목적</h2>
          <p>오센틱아트(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
          <ul>
            <li>회원 가입 및 관리</li>
            <li>클래스 예약 및 결제 서비스 제공</li>
            <li>상품 주문 및 배송 처리</li>
            <li>강사 정산 처리</li>
            <li>고객 문의 및 불만 처리</li>
          </ul>

          <h2>2. 수집하는 개인정보 항목</h2>
          <p><strong>필수 항목:</strong> 이름, 이메일, 비밀번호</p>
          <p><strong>선택 항목:</strong> 휴대폰 번호, 거주 지역</p>
          <p><strong>주문/배송 시 추가 수집:</strong> 배송지 주소, 수령인 정보</p>

          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <ul>
            <li>회원 탈퇴 시까지 (단, 관련 법령에 따라 일정 기간 보존)</li>
            <li>전자상거래법에 따른 계약 및 청약 철회 기록: 5년</li>
            <li>결제 및 공급 기록: 5년</li>
            <li>소비자 불만 및 분쟁 처리 기록: 3년</li>
          </ul>

          <h2>4. 개인정보의 제3자 제공</h2>
          <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다.</p>
          <ul>
            <li>이용자의 사전 동의가 있는 경우</li>
            <li>법령에 의해 제공 의무가 있는 경우</li>
            <li>결제 처리를 위한 PG사(토스페이먼츠) 제공</li>
          </ul>

          <h2>5. 개인정보 처리 위탁</h2>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left'}}>수탁자</th>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left'}}>위탁 업무</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>토스페이먼츠</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>결제 처리</td>
              </tr>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>Supabase</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>데이터 저장 및 인증</td>
              </tr>
            </tbody>
          </table>

          <h2>6. 이용자의 권리</h2>
          <p>이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다. support@authenticart.kr로 연락해 주세요.</p>

          <h2>7. 개인정보 보호책임자</h2>
          <p>이메일: support@authenticart.kr</p>
        </div>
      </div>
    </div>
  )
}
