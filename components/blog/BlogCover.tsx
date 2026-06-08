import { categoryLabel, categoryEmoji } from '@/lib/blog'

/**
 * 대표 이미지가 없는 블로그 글에 자동으로 보여줄 "제목 썸네일".
 * 별도 이미지 호스팅 없이 제목·카테고리가 들어간 브랜드 카드를 CSS로 생성해
 * 목록·홈·상세에서 가독성과 시각적 일관성을 높인다.
 */
export default function BlogCover({
  title,
  category,
  size = 'card',
}: {
  title: string
  category: string
  size?: 'card' | 'hero'
}) {
  const isHero = size === 'hero'
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-brand-deep via-brand-deep to-brand-sage flex flex-col justify-between">
      {/* 장식 요소 */}
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-brand-amber/15" />
      <div className="absolute -left-8 -bottom-12 w-36 h-36 rounded-full bg-white/5" />
      <div className={`relative flex flex-col justify-between h-full ${isHero ? 'p-8 md:p-10' : 'p-5'}`}>
        <span className={`font-semibold text-brand-amber tracking-wide ${isHero ? 'text-sm' : 'text-xs'}`}>
          {categoryEmoji(category)} {categoryLabel(category)}
        </span>
        <h3
          className={`font-bold text-white leading-snug drop-shadow ${
            isHero ? 'text-2xl md:text-4xl line-clamp-4' : 'text-lg line-clamp-3'
          }`}
        >
          {title}
        </h3>
        <span className={`text-brand-mist/70 tracking-widest uppercase ${isHero ? 'text-xs' : 'text-[10px]'}`}>
          Authentic Art · 공예 매거진
        </span>
      </div>
    </div>
  )
}
