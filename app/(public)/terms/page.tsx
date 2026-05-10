export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-brand-ink mb-2">이용약관</h1>
        <p className="text-brand-grey text-sm mb-8">최종 수정일: 2026년 5월 1일</p>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 prose prose-sm max-w-none text-brand-ink">
          <h2>제1조 (목적)</h2>
          <p>이 약관은 오센틱아트(이하 "회사")가 운영하는 authenticart.kr(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

          <h2>제2조 (정의)</h2>
          <ul>
            <li>"서비스"란 회사가 제공하는 레진 공예 클래스 예약 및 상품 판매 플랫폼을 의미합니다.</li>
            <li>"이용자"란 서비스에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
            <li>"강사"란 회사의 심사를 통해 클래스를 개설하고 운영하는 회원을 말합니다.</li>
          </ul>

          <h2>제3조 (약관의 효력 및 변경)</h2>
          <p>이 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다. 회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 고지합니다.</p>

          <h2>제4조 (서비스의 제공)</h2>
          <p>회사는 다음과 같은 서비스를 제공합니다.</p>
          <ul>
            <li>레진 공예 클래스 예약 및 결제 서비스</li>
            <li>레진 공예 용품 쇼핑몰 서비스</li>
            <li>강사 정산 서비스</li>
          </ul>

          <h2>제5조 (결제 및 환불)</h2>
          <p>클래스 예약 취소 및 환불은 클래스 시작일 기준으로 다음 정책이 적용됩니다.</p>
          <ul>
            <li>7일 이상 전 취소: 전액 환불</li>
            <li>3~7일 전 취소: 50% 환불</li>
            <li>3일 이내 취소: 환불 불가</li>
          </ul>

          <h2>제6조 (개인정보 보호)</h2>
          <p>회사는 관련 법령에 따라 이용자의 개인정보를 보호합니다. 자세한 내용은 개인정보처리방침을 참고하세요.</p>

          <h2>제7조 (면책)</h2>
          <p>회사는 천재지변, 불가항력 등으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</p>

          <h2>제8조 (분쟁 해결)</h2>
          <p>서비스 이용과 관련하여 발생한 분쟁은 대한민국 법률에 따라 처리됩니다.</p>
        </div>
      </div>
    </div>
  )
}
