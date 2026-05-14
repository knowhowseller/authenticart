export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-brand-ink mb-2">개인정보처리방침</h1>
        <p className="text-brand-grey text-sm mb-8">시행일: 2026년 5월 15일 | 최종 수정일: 2026년 5월 15일</p>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 prose prose-sm max-w-none text-brand-ink">
          <p>주식회사 오센틱아트(이하 "회사")는 「개인정보 보호법」 및 관련 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하게 처리하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.</p>

          <h2>1. 개인정보의 처리 목적</h2>
          <p>회사는 다음의 목적을 위해 개인정보를 처리합니다. 처리한 개인정보는 해당 목적 외의 용도로 이용되지 않으며, 이용 목적이 변경될 경우 별도 동의를 받습니다.</p>
          <ul>
            <li>회원 가입 및 관리, 본인 확인</li>
            <li>클래스 예약 및 결제 서비스 제공</li>
            <li>상품 주문, 결제, 배송 처리</li>
            <li>강사 심사, 승인, 정산 처리</li>
            <li>고객 문의 및 불만 처리</li>
            <li>서비스 개선 및 통계 분석</li>
            <li>마케팅·광고 활용 (별도 동의 시)</li>
          </ul>

          <h2>2. 수집하는 개인정보 항목</h2>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left', background:'#fafafa'}}>구분</th>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left', background:'#fafafa'}}>항목</th>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left', background:'#fafafa'}}>수집 방법</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>회원 가입 (필수)</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>이름, 이메일, 비밀번호</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>회원가입 폼</td>
              </tr>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>회원 가입 (선택)</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>휴대폰 번호, 거주 지역</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>회원가입 폼</td>
              </tr>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>주문·배송</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>수령인 이름, 배송지 주소, 수령인 연락처</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>주문 시 입력</td>
              </tr>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>강사 신청</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>이름, 이메일, 연락처, 활동 지역, 전문 분야, 자기소개, 정산 계좌 정보</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>강사 신청 폼</td>
              </tr>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>소셜 로그인</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>이메일, 이름 (카카오·구글에서 제공)</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>OAuth 인증</td>
              </tr>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>자동 수집</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>접속 IP, 쿠키, 서비스 이용 기록, 기기 정보</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>시스템 자동 수집</td>
              </tr>
            </tbody>
          </table>

          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <ul>
            <li>회원 정보: 회원 탈퇴 시까지 (단, 아래 법령에 따라 보존)</li>
            <li>계약 및 청약철회 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            <li>결제 및 재화 공급 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            <li>소비자 불만 및 분쟁 처리 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            <li>표시·광고 기록: 6개월 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            <li>로그인 기록: 3개월 (통신비밀보호법)</li>
          </ul>

          <h2>4. 개인정보의 제3자 제공</h2>
          <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우는 예외입니다.</p>
          <ul>
            <li>이용자의 사전 동의가 있는 경우</li>
            <li>법령에 의해 제공 의무가 있는 경우 (수사기관의 적법한 요청 등)</li>
          </ul>

          <h2>5. 개인정보 처리 위탁</h2>
          <p>회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다. 회사는 위탁 계약 시 개인정보가 안전하게 관리될 수 있도록 관련 사항을 규정합니다.</p>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left', background:'#fafafa'}}>수탁자</th>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left', background:'#fafafa'}}>위탁 업무</th>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left', background:'#fafafa'}}>보유 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>토스페이먼츠(주)</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>결제 처리 및 결제 정보 보관</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>위탁 계약 종료 시</td>
              </tr>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>Resend Inc.</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>이메일 발송 (예약 확인, 환불, 정산 알림 등)</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>발송 완료 후 즉시 파기</td>
              </tr>
            </tbody>
          </table>

          <h2>6. 개인정보의 국외이전</h2>
          <p>회사는 서비스 운영을 위해 아래와 같이 개인정보를 국외로 이전합니다. 이전받는 자는 개인정보 보호를 위한 적절한 보호조치를 취하고 있으며, 회사는 관련 법령에 따라 이를 관리합니다.</p>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left', background:'#fafafa'}}>이전받는 자</th>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left', background:'#fafafa'}}>국가</th>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left', background:'#fafafa'}}>이전 항목</th>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left', background:'#fafafa'}}>이전 목적</th>
                <th style={{border:'1px solid #eee', padding:'8px', textAlign:'left', background:'#fafafa'}}>보유 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>Supabase Inc.</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>미국</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>이름, 이메일, 연락처, 서비스 이용 기록 등 서비스 운영에 필요한 모든 데이터</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>데이터 저장 및 인증 서비스 제공</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>회원 탈퇴 또는 서비스 종료 시</td>
              </tr>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px'}}>Resend Inc.</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>미국</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>이름, 이메일</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>이메일 발송 서비스 제공</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>발송 완료 후 즉시 파기</td>
              </tr>
            </tbody>
          </table>

          <h2>7. 이용자의 권리 및 행사 방법</h2>
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람 요청</li>
            <li>개인정보 정정·삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>개인정보 이동 요청</li>
          </ul>
          <p>권리 행사는 <strong>support@authenticart.kr</strong>로 이메일을 통해 요청하시면 지체 없이(최대 <strong>10일 이내</strong>) 처리하겠습니다. 다만, 관련 법령에서 보존 의무를 정한 정보는 삭제가 제한될 수 있습니다.</p>

          <h2>8. 쿠키(Cookie)의 운영</h2>
          <p>회사는 서비스 이용 편의 향상을 위해 쿠키를 사용합니다. 쿠키란 웹사이트가 이용자의 브라우저로 전송하는 소규모 텍스트 파일로, 이용자의 기기에 저장됩니다.</p>
          <ul>
            <li><strong>사용 목적:</strong> 로그인 상태 유지, 서비스 이용 패턴 분석, 맞춤형 서비스 제공</li>
            <li><strong>거부 방법:</strong> 브라우저 설정에서 쿠키 허용 여부를 선택할 수 있습니다.
              <ul>
                <li>Chrome: 설정 → 개인정보 및 보안 → 쿠키 및 사이트 데이터</li>
                <li>Safari: 환경설정 → 개인정보 보호 → 쿠키 차단</li>
              </ul>
            </li>
            <li>쿠키 차단 시 로그인 상태 유지 등 일부 서비스 이용이 제한될 수 있습니다.</li>
          </ul>

          <h2>9. 개인정보의 파기</h2>
          <p>회사는 개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 해당 개인정보를 파기합니다.</p>
          <ul>
            <li><strong>전자 파일:</strong> 복원 불가능한 기술적 방법으로 영구 삭제</li>
            <li><strong>서면 자료:</strong> 분쇄기 이용 파기</li>
          </ul>
          <p>법령에 따라 보존해야 하는 개인정보는 별도 데이터베이스로 분리 보관하며, 해당 목적 외로는 이용하지 않습니다.</p>

          <h2>10. 개인정보 보호책임자</h2>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <tbody>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px', fontWeight:'bold', width:'30%'}}>성명 / 직위</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>유진 / 대표이사</td>
              </tr>
              <tr>
                <td style={{border:'1px solid #eee', padding:'8px', fontWeight:'bold'}}>이메일</td>
                <td style={{border:'1px solid #eee', padding:'8px'}}>support@authenticart.kr</td>
              </tr>
            </tbody>
          </table>
          <p>개인정보 침해 관련 신고·상담은 아래 기관에도 문의할 수 있습니다.</p>
          <ul>
            <li>개인정보분쟁조정위원회: privacy.go.kr / 1833-6972</li>
            <li>개인정보침해신고센터 (한국인터넷진흥원): privacy.kisa.or.kr / 118</li>
            <li>대검찰청 사이버수사과: 02-3480-3573</li>
            <li>경찰청 사이버범죄신고시스템: 182</li>
          </ul>

          <p className="text-xs text-brand-grey mt-8 pt-4 border-t border-brand-mist/30">이 방침은 2026년 5월 15일부터 시행됩니다.</p>
        </div>
      </div>
    </div>
  )
}
