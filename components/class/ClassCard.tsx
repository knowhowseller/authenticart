import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Star } from 'lucide-react'
import { formatPrice, formatDuration } from '@/lib/utils/format'
import type { ClassAttributes, ConfirmationMode } from '@/types/database'

interface ClassCardProps {
  id: string
  title: string
  instructorName: string
  region: string
  price: number
  thumbnail_url: string | null
  confirmation_mode: ConfirmationMode
  attributes: ClassAttributes
  available_seats?: number
  avg_rating?: number
  review_count?: number
}

const difficultyBadge = {
  beginner:     { label: '입문',  color: 'bg-brand-blush text-brand-ink' },
  intermediate: { label: '중급',  color: 'bg-brand-sage/20 text-brand-deep' },
  advanced:     { label: '고급',  color: 'bg-brand-deep/10 text-brand-deep' },
}

export default function ClassCard({
  id, title, instructorName, region, price,
  thumbnail_url, confirmation_mode, attributes, available_seats,
  avg_rating, review_count,
}: ClassCardProps) {
  const diff = attributes.difficulty
  const badge = diff ? difficultyBadge[diff] : null

  return (
    <Link href={`/classes/${id}`} className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-mist/30 hover:shadow-md transition-all duration-200">
      {/* 썸네일 */}
      <div className="relative aspect-[4/3] bg-brand-bg overflow-hidden">
        {thumbnail_url ? (
          <Image
            src={thumbnail_url}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-blush/30 to-brand-mist/30">
            <span className="text-4xl opacity-30">🎨</span>
          </div>
        )}
        {/* 배지들 */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {badge && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
              {badge.label}
            </span>
          )}
          {confirmation_mode === 'instant' ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-amber text-brand-ink">
              바로 결제
            </span>
          ) : (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/90 text-brand-deep border border-brand-deep/20">
              강사 승인
            </span>
          )}
        </div>
        {available_seats !== undefined && available_seats <= 2 && available_seats > 0 && (
          <div className="absolute bottom-2 right-2 text-xs font-medium bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-200">
            잔여 {available_seats}석
          </div>
        )}
        {available_seats === 0 && (
          <div className="absolute inset-0 bg-brand-ink/40 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">마감</span>
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        <p className="text-xs text-brand-grey mb-1">{instructorName}</p>
        <h3 className="text-sm font-semibold text-brand-ink line-clamp-2 leading-snug mb-2 group-hover:text-brand-deep transition-colors">
          {title}
        </h3>
        {avg_rating !== undefined && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={11} className="text-brand-amber fill-brand-amber" />
            <span className="text-xs font-bold text-brand-deep">{avg_rating.toFixed(1)}</span>
            {review_count !== undefined && (
              <span className="text-xs text-brand-grey">후기 {review_count}</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-brand-grey mb-3">
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {region}
          </span>
          {attributes.duration_active && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatDuration(attributes.duration_active)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-brand-deep">{formatPrice(price)}</span>
          {attributes.craft_type && (
            <span className="text-xs text-brand-grey bg-brand-bg px-2 py-0.5 rounded-full">
              {attributes.craft_type === 'resin' ? '레진' : attributes.craft_type}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
