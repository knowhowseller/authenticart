import Hexagon from '@/components/brand/Hexagon'
import FlowLine from '@/components/brand/FlowLine'
import MarbleBackground from '@/components/brand/MarbleBackground'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Hero */}
      <section className="relative bg-brand-deep text-white py-20 overflow-hidden">
        <MarbleBackground opacity={0.15} />
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="flex items-center gap-2 justify-center mb-4">
            <Hexagon color="amber" size={16} />
            <span className="text-xs font-medium text-brand-amber uppercase tracking-widest">About</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-display">오센틱아트</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            진정성 있는 공예의 가치를 나누는 플랫폼.<br />
            심사를 통해 선발된 아트 강사와 수강생을 연결합니다.
          </p>
        </div>
      </section>

      <FlowLine className="text-brand-deep fill-brand-deep" />

      {/* Values */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎨',
                title: '진정성 (Authentic)',
                desc: '우리는 진짜 공예를 믿습니다. 기계가 아닌 손으로, 대량 생산이 아닌 하나하나 정성을 담아 만드는 작품의 가치를 전달합니다.',
              },
              {
                icon: '🤝',
                title: '연결 (Connect)',
                desc: '숙련된 강사와 배움을 원하는 수강생 사이의 신뢰로운 만남. 서류·포트폴리오 심사와 관리자 승인을 거친 강사들과 함께하는 클래스로 안심하고 배울 수 있습니다.',
              },
              {
                icon: '✨',
                title: '성장 (Grow)',
                desc: '취미를 시작하든, 전문 강사를 꿈꾸든, 오센틱아트는 모든 단계의 성장을 지원합니다.',
              },
            ].map(v => (
              <div key={v.title} className="text-center">
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="text-lg font-bold text-brand-ink mb-2">{v.title}</h3>
                <p className="text-brand-grey text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-deep/5">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-brand-ink mb-4">지금 시작하세요</h2>
          <p className="text-brand-grey mb-8">레진 공예의 세계로 첫 발을 내딛어 보세요</p>
          <div className="flex gap-3 justify-center">
            <Link href="/classes"
              className="px-6 py-3 bg-brand-deep text-white rounded-xl font-medium hover:bg-brand-deep/90 transition-colors text-sm">
              클래스 둘러보기
            </Link>
            <Link href="/signup/instructor"
              className="px-6 py-3 bg-white border border-brand-mist text-brand-ink rounded-xl font-medium hover:border-brand-deep/30 transition-colors text-sm">
              강사 신청하기
            </Link>
          </div>
        </div>
      </section>

      {/* 회사 정보 */}
      <section className="py-12 border-t border-brand-mist/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-6">회사 정보</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-brand-grey leading-relaxed">
            <div className="space-y-1.5">
              <p><span className="font-medium text-brand-ink">상호</span> · 주식회사 오센틱아트</p>
              <p><span className="font-medium text-brand-ink">대표</span> · 유진</p>
              <p><span className="font-medium text-brand-ink">사업자등록번호</span> · 102-81-47445</p>
              <p><span className="font-medium text-brand-ink">통신판매업신고</span> · 제2023-경기군포-00203호</p>
            </div>
            <div className="space-y-1.5">
              <p><span className="font-medium text-brand-ink">주소</span> · 경기도 군포시 공단로140번길 27, 군포LS R&amp;D센터 819호</p>
              <p><span className="font-medium text-brand-ink">이메일</span> · support@authenticart.kr</p>
              <p>
                <span className="font-medium text-brand-ink">채널</span> ·{' '}
                <a href="http://pf.kakao.com/_AaxjDxj" target="_blank" rel="noopener noreferrer" className="hover:text-brand-deep transition-colors">카카오채널</a>
                {' '}·{' '}
                <a href="https://instagram.com/authentic_art.rs/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-deep transition-colors">인스타그램</a>
                {' '}·{' '}
                <a href="https://cafe.naver.com/authenticart" target="_blank" rel="noopener noreferrer" className="hover:text-brand-deep transition-colors">네이버카페</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
