import Link from 'next/link'
import Logo from '@/components/brand/Logo'
import FlowLine from '@/components/brand/FlowLine'

function IconInstagram() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4.5"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function IconKakao() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.582 2 11.002c0 2.838 1.686 5.335 4.236 6.87l-1.079 3.994a.3.3 0 0 0 .46.327l4.603-3.065C10.727 19.043 11.36 19.1 12 19.1c5.523 0 10-3.582 10-8.098C22 6.582 17.523 3 12 3z"/>
    </svg>
  )
}

function IconNaverCafe() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.273 12.845 7.376 3H3v18h7.727V11.155l8.897 9.845H24V3h-7.727z"/>
    </svg>
  )
}

const socials = [
  { label: 'Instagram', href: 'https://instagram.com/authentic_art.rs/', Icon: IconInstagram },
  { label: 'KakaoTalk', href: 'http://pf.kakao.com/_AaxjDxj', Icon: IconKakao },
  { label: '네이버카페', href: 'https://cafe.naver.com/authenticart', Icon: IconNaverCafe },
]

const footerLinks = [
  {
    title: '서비스',
    links: [
      { label: '클래스 찾기', href: '/classes' },
      { label: '재료 쇼핑', href: '/shop' },
      { label: '강사 소개', href: '/instructors' },
      { label: '공예 매거진', href: '/blog' },
      { label: '강사 신청', href: '/signup/instructor' },
    ],
  },
  {
    title: '오센틱아트',
    links: [
      { label: '회사 소개', href: '/about' },
      { label: '이용약관', href: '/terms' },
      { label: '개인정보처리방침', href: '/privacy' },
      { label: '환불 규정', href: '/refund-policy' },
      { label: '네이버카페', href: 'https://cafe.naver.com/authenticart' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-brand-deep text-white">
      <FlowLine color="#7F9593" className="opacity-30" />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo variant="white" size="md" className="mb-3" />
            <p className="text-xs font-medium text-brand-amber/80 mt-2 tracking-wide uppercase">
              Starting a second life with authentic Art
            </p>
            <p className="text-sm text-brand-mist/80 mt-1 leading-relaxed">
              진정한 예술로 제2의 삶을 시작하다
            </p>
            <div className="flex gap-3 mt-4">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-brand-amber/20 flex items-center justify-center text-brand-mist hover:text-brand-amber transition-all"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {footerLinks.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-brand-amber mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-brand-mist/70 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-brand-sage/20 pt-6 flex flex-col md:flex-row justify-between items-start gap-2">
          <p className="text-xs text-brand-mist/50 leading-relaxed">
            (주)오센틱아트 | 대표: 유진 | 사업자등록번호: 102-81-47445<br />
            통신판매업신고: 제2023-경기군포-00203호 | 주소: 경기도 군포시 공단로140번길 27, 군포LS R&amp;D센터 819호<br />
            이메일: contact@authenticart.co.kr
          </p>
          <p className="text-xs text-brand-mist/40 shrink-0">
            © {new Date().getFullYear()} Authentic Art. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
