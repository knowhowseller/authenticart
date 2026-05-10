import type { ClassAttributes } from '@/types/database'
import Hexagon from './Hexagon'

interface ClassBadgesProps {
  attributes: ClassAttributes
}

const difficultyLabel = { beginner: '입문', intermediate: '중급', advanced: '고급' }
const pickupLabel = { shipping: '택배 수령', pickup: '방문 수령', both: '택배/방문' }

function Badge({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className="flex items-start gap-2 bg-white rounded-xl p-3 shadow-sm border border-brand-mist/40">
      <div className="flex-shrink-0 mt-0.5">
        <Hexagon color="amber" size={20} rotate={15} />
      </div>
      <div>
        <p className="text-xs text-brand-grey font-medium">{label}</p>
        <p className="text-sm text-brand-ink font-medium mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function ClassBadges({ attributes }: ClassBadgesProps) {
  const badges: { label: string; value: string }[] = []

  if (attributes.difficulty) {
    badges.push({ label: '난이도', value: difficultyLabel[attributes.difficulty] ?? attributes.difficulty })
  }
  if (attributes.duration_active) {
    badges.push({ label: '작업 시간', value: `${attributes.duration_active}분` })
  }
  if (attributes.duration_curing) {
    const h = Math.floor(attributes.duration_curing / 60)
    const m = attributes.duration_curing % 60
    badges.push({ label: '경화 시간', value: h > 0 ? `${h}시간 ${m > 0 ? m + '분' : ''}`.trim() : `${m}분` })
  }
  if (attributes.pickup_method) {
    badges.push({ label: '수령 방식', value: pickupLabel[attributes.pickup_method] ?? attributes.pickup_method })
  }
  if (attributes.min_age) {
    badges.push({ label: '최소 연령', value: `${attributes.min_age}세 이상` })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {badges.map((b) => (
          <Badge key={b.label} label={b.label} value={b.value} />
        ))}
      </div>

      {attributes.required_items && attributes.required_items.length > 0 && (
        <div className="bg-brand-blush/20 rounded-xl p-3 border border-brand-blush/40">
          <p className="text-xs text-brand-grey font-medium mb-1.5">필수 지참</p>
          <div className="flex flex-wrap gap-1.5">
            {attributes.required_items.map((item) => (
              <span key={item} className="text-xs bg-white text-brand-ink px-2 py-0.5 rounded-full border border-brand-mist/50">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {attributes.provided_items && attributes.provided_items.length > 0 && (
        <div className="bg-white rounded-xl p-3 border border-brand-mist/40">
          <p className="text-xs text-brand-grey font-medium mb-1.5">제공 재료</p>
          <div className="flex flex-wrap gap-1.5">
            {attributes.provided_items.map((item) => (
              <span key={item} className="text-xs bg-brand-bg text-brand-ink px-2 py-0.5 rounded-full border border-brand-mist/50">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {attributes.cautions && attributes.cautions.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
          <p className="text-xs text-amber-700 font-medium mb-1.5">주의 사항</p>
          <ul className="space-y-0.5">
            {attributes.cautions.map((c) => (
              <li key={c} className="text-xs text-brand-ink flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-brand-amber flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
