import type { Metadata } from 'next'

// group-request 페이지는 클라이언트 컴포넌트라 metadata를 내보낼 수 없어 레이아웃에서 정의
export const metadata: Metadata = {
  title: '단체 출강 신청',
  description:
    '학교·기업·기관 단체 공예 클래스 출강 신청. 5인 이상 맞춤 프로그램을 전국 인증 강사로 연결하며, 신청 후 24시간 내 담당자가 연락드립니다.',
  alternates: { canonical: '/group-request' },
  openGraph: {
    title: '단체 출강 신청 | 오센틱아트',
    description: '5인 이상 단체 맞춤 공예 프로그램 — 기업 팀빌딩·학교·기관 출강',
    type: 'website',
  },
}

export default function GroupRequestLayout({ children }: { children: React.ReactNode }) {
  return children
}
