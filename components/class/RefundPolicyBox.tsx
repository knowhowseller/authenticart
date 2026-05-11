export default function RefundPolicyBox() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
      <h2 className="text-base font-semibold text-brand-ink mb-3">환불 정책</h2>
      <div className="space-y-2">
        {[
          { cond: '수업 7일 전까지 취소', result: '100% 환불', color: 'text-green-600' },
          { cond: '수업 3~6일 전 취소',   result: '50% 환불',  color: 'text-orange-500' },
          { cond: '수업 3일 이내 취소',    result: '환불 불가', color: 'text-red-500' },
        ].map(item => (
          <div key={item.cond} className="flex items-center justify-between py-2 border-b border-brand-mist/20 last:border-0">
            <span className="text-sm text-brand-grey">{item.cond}</span>
            <span className={`text-sm font-semibold ${item.color}`}>{item.result}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-brand-grey mt-3">환불 처리는 영업일 기준 3~5일 소요됩니다.</p>
    </div>
  )
}
