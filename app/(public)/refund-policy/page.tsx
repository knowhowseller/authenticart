export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-brand-ink mb-2">환불 정책</h1>
        <p className="text-brand-grey text-sm mb-8">최종 수정일: 2026년 5월 15일</p>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30 space-y-8">

          {/* 클래스 환불 */}
          <div>
            <h2 className="text-lg font-bold text-brand-ink mb-4">1. 클래스 환불 기준</h2>
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
            <ul className="list-disc list-inside space-y-2 text-sm text-brand-grey mt-4">
              <li>취소 기준은 클래스 <strong>시작 시간</strong> 기준입니다.</li>
              <li><strong>회사 또는 강사 귀책</strong>으로 클래스가 취소될 경우 100% 전액 환불됩니다.</li>
              <li>쿠폰 적용 후 50% 환불 시, 실제 결제 금액(할인 후 금액) 기준으로 50%가 환불됩니다. 쿠폰 할인분은 환불 금액에 포함되지 않습니다.</li>
              <li>환불은 원결제 수단으로 처리되며, 영업일 기준 <strong>3~5일</strong> 내 완료됩니다.</li>
            </ul>
          </div>

          {/* 클래스 환불 신청 방법 */}
          <div className="pt-4 border-t border-brand-mist/30">
            <h2 className="text-lg font-bold text-brand-ink mb-3">2. 클래스 환불 신청 방법</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-brand-ink">
              <li>마이페이지 → 예약 내역에서 해당 예약의 <strong>환불 신청</strong> 버튼 클릭</li>
              <li>환불 가능 여부 및 환불 금액 확인</li>
              <li>환불 신청 완료 후 영업일 기준 3~5일 내 원결제 수단으로 환불</li>
            </ol>
          </div>

          {/* 쇼핑몰 청약철회 */}
          <div className="pt-4 border-t border-brand-mist/30">
            <h2 className="text-lg font-bold text-brand-ink mb-3">3. 쇼핑몰 상품 청약철회 및 반품</h2>
            <p className="text-sm text-brand-ink mb-4">
              「전자상거래 등에서의 소비자보호에 관한 법률」 제17조에 따라, 상품 수령 후 <strong>7일 이내</strong>에는 별도 사유 없이 청약철회(반품)가 가능합니다.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-green-700 mb-2">반품 가능한 경우</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                <li>상품 수령 후 <strong>7일 이내</strong> 단순 변심 반품</li>
                <li>상품 불량, 파손, 오배송 — 수령 후 3개월 이내, 사실 인지 후 30일 이내</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-red-700 mb-2">반품 불가 경우 (전자상거래법 제17조 제2항)</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                <li>소비자 귀책으로 상품이 훼손·오염된 경우</li>
                <li>사용·개봉으로 상품 가치가 현저히 감소한 경우</li>
                <li>소비기한이 경과하는 등 재판매가 현저히 곤란한 경우</li>
                <li>복제 가능한 상품의 포장을 훼손한 경우</li>
              </ul>
            </div>

            <div className="bg-brand-bg rounded-xl p-4">
              <p className="text-sm font-semibold text-brand-ink mb-2">반품·교환 배송비</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-brand-grey">
                <li><strong>단순 변심 반품:</strong> 왕복 배송비 소비자 부담 (반품 배송비 약 5,000~7,000원)</li>
                <li><strong>상품 불량·오배송:</strong> 배송비 전액 회사 부담</li>
              </ul>
            </div>
          </div>

          {/* 쇼핑몰 반품 신청 방법 */}
          <div className="pt-4 border-t border-brand-mist/30">
            <h2 className="text-lg font-bold text-brand-ink mb-3">4. 쇼핑몰 반품·교환 신청 방법</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-brand-ink">
              <li>마이페이지 → 주문 내역에서 해당 주문의 <strong>반품 신청</strong> 버튼 클릭 또는 support@authenticart.kr로 문의</li>
              <li>반품 사유 및 상품 상태 사진 제출</li>
              <li>반품 접수 확인 후 수거 진행</li>
              <li>상품 상태 확인 완료 후 영업일 기준 3~5일 내 환불 처리</li>
            </ol>
          </div>

          {/* 작품 판매 환불 */}
          <div className="pt-4 border-t border-brand-mist/30">
            <h2 className="text-lg font-bold text-brand-ink mb-3">5. 작품 구매 환불</h2>
            <p className="text-sm text-brand-grey">
              작품은 예술가가 직접 제작한 개성 있는 1회성 작품으로, 「전자상거래법」 제17조 제2항에 따라 단순 변심에 의한 청약철회가 제한될 수 있습니다.
              작품 불량 또는 작품 설명과 현저히 다른 경우에는 수령 후 <strong>7일 이내</strong> support@authenticart.kr로 신청하시면 처리해드립니다.
            </p>
          </div>

          {/* 문의 */}
          <div className="pt-4 border-t border-brand-mist/30 bg-brand-bg/50 rounded-xl p-4">
            <p className="text-sm text-brand-grey">
              환불·반품 문의:{' '}
              <strong>support@authenticart.kr</strong>
              {' '}·{' '}
              <a href="http://pf.kakao.com/_AaxjDxj" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-deep transition-colors">카카오 채널 문의</a>
            </p>
            <p className="text-xs text-brand-grey mt-1">소비자 피해 관련 분쟁은 한국소비자원(국번없이 1372) 또는 공정거래위원회(국번없이 1372)에 신고하실 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
