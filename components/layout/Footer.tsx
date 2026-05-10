import Link from 'next/link'
import Logo from '@/components/brand/Logo'
import FlowLine from '@/components/brand/FlowLine'

const socials = [
  { label: 'Instagram', href: 'https://instagram.com/authenticart_kr', icon: '📷' },
  { label: 'YouTube', href: 'https://youtube.com/@authenticart', icon: '▶' },
  { label: 'KakaoTalk', href: 'https://pf.kakao.com/authenticart', icon: '💬' },
]

const footerLinks = [
  {
    title: '서비스',
    links: [
      { label: '클래스 찾기', href: '/classes' },
      { label: '재료 쇼핑', href: '/shop' },
      { label: '강사 소개', href: '/instructors' },
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
            <p className="text-sm text-brand-mist/80 mt-2 leading-relaxed">
              Starting a second life with Authentic Art<br />
              레진 공예로 시작하는 예술적 삶
            </p>
            <div className="flex gap-4 mt-4">
              {socials.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-mist hover:text-brand-amber transition-colors text-lg"
                  aria-label={label}
                >
                  {icon}
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
          <p className="text-xs text-brand-mist/50">
            (주)오센틱아트 | 대표: · | 사업자등록번호: 000-00-00000<br />
            통신판매업신고: 제2026-000-000호 | 주소: 인천광역시
          </p>
          <p className="text-xs text-brand-mist/40">
            © 2026 Authentic Art. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
