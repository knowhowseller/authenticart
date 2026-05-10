export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-brand-ink mb-2">환불 정책</h1>
        <p className="text-brand-grey text-sm mb-8">오센틱아트 클래스 환불 규정</p>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-brand-ink mb-4">클래스 환불 기준</h2>
            <div className="space-y-3">
              {[
                { period: '클래스 7일 이상 전 취소', refund: '100% 전액 환불', color: 'bg-green-50 text-green-700 border-green-200' },
                { period: '클래스 3~7일 전 취소', refund: '50% 환불', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                { period: '클래스 3일 이내 취소', refund: '환불 불가', color: 'bg-red-50 text-red-700 border-red-200' },
              ].map(item => (
                <div key={item.period} className={`flex items-center justify-between p-4 rounded-xl border ${item.color}`}>
                  <span className="font-medium text-sm">{item.period}</span>
                  <span className="font-bold text-sm">{item.refund}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-brand-mist/30">
            <h2 className="text-lg font-bold text-brand-ink mb-3">환불 신청 방법</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-brand-ink">
              <li>마이페이지 → 예약 내역에서 해당 예약의 <strong>환불 신청</strong> 버튼 클릭</li>
              <li>환불 가능 여부 및 금액 확인</li>
              <li>환불 신청 완료 후 영업일 기준 3~5일 내 원결제 수단으로 환불</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-brand-mist/30">
            <h2 className="text-lg font-bold text-brand-ink mb-3">유의사항</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-brand-grey">
              <li>취소 기준은 클래스 <strong>시작 시간</strong> 기준입니다</li>
              <li>강사의 개인 사정으로 클래스가 취소될 경우 100% 환불됩니다</li>
              <li>상품(쇼핑몰) 구매는 별도 반품·교환 정책이 적용됩니다</li>
              <li>문의: support@authenticart.kr</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
