'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Hexagon from '@/components/brand/Hexagon'
import JsonLd from '@/components/seo/JsonLd'

const faqs = [
  {
    category: '예약 및 결제',
    items: [
      {
        q: '예약은 어떻게 하나요?',
        a: '원하는 클래스를 선택하고 일정을 고른 후 결제하면 됩니다. 강사 승인 방식의 클래스는 강사 확인 후 결제 링크가 발송됩니다.',
      },
      {
        q: '결제 수단은 어떤 것이 있나요?',
        a: '신용카드, 체크카드, 카카오페이, 네이버페이 등 다양한 결제 수단을 지원합니다.',
      },
      {
        q: '예약 확정은 언제 되나요?',
        a: '바로 결제 방식은 결제 완료 즉시 확정됩니다. 강사 승인 방식은 강사가 24시간 이내에 승인 후 결제 링크를 보내드립니다.',
      },
      {
        q: '쿠폰은 어떻게 사용하나요?',
        a: '예약 화면에서 일정을 선택하면 쿠폰 입력란이 나타납니다. 보유한 쿠폰 코드를 입력 후 "적용" 버튼을 누르면 할인이 적용됩니다.',
      },
    ],
  },
  {
    category: '취소 및 환불',
    items: [
      {
        q: '예약 취소는 언제까지 가능한가요?',
        a: '클래스 시작 7일 전까지는 전액 환불, 3~7일 전 50% 환불, 3일 이내는 환불이 불가합니다. (클래스별 정책에 따라 다를 수 있습니다)',
      },
      {
        q: '환불은 얼마나 걸리나요?',
        a: '환불 승인 후 3~5 영업일 내에 원결제 수단으로 입금됩니다.',
      },
      {
        q: '강사가 클래스를 취소하면 어떻게 되나요?',
        a: '강사 사정으로 클래스가 취소될 경우 전액 환불 처리됩니다.',
      },
    ],
  },
  {
    category: '강사 신청',
    items: [
      {
        q: '강사 신청 자격은 무엇인가요?',
        a: '공예 작품 포트폴리오와 강의 역량을 갖추면 신청할 수 있습니다. 국가공인 자격증은 필수가 아니며, 포트폴리오·역량 심사를 통해 오센틱아트 인증 강사 자격을 부여합니다.',
      },
      {
        q: '강사 심사 기간은 얼마나 걸리나요?',
        a: '신청 후 영업일 기준 3~5일 내에 결과를 이메일로 안내해드립니다.',
      },
      {
        q: '강사 수수료(정산)는 얼마인가요?',
        a: '플랫폼 수수료는 결제금액의 10%이며, 결제 대행사(PG) 수수료 약 3.3%가 별도입니다. 두 수수료를 합산한 13.3%를 공제하고 강사가 결제액의 86.7%를 수령합니다. 클래스 등록에 별도 고정 비용은 없습니다.',
      },
      {
        q: '정산은 언제 받나요?',
        a: '매월 말일 기준으로 정산되며, 익월 10일 전후로 등록한 계좌로 입금됩니다.',
      },
    ],
  },
  {
    category: '회원 계정',
    items: [
      {
        q: '비밀번호를 잊어버렸어요',
        a: '로그인 화면에서 "비밀번호를 잊으셨나요?" 링크를 클릭하면 이메일로 재설정 링크를 받을 수 있습니다.',
      },
      {
        q: '소셜 로그인(카카오/구글)도 가능한가요?',
        a: '네, 카카오와 구글 계정으로 간편하게 가입하고 로그인할 수 있습니다.',
      },
      {
        q: '회원 탈퇴는 어떻게 하나요?',
        a: '고객센터 이메일(contact@authenticart.co.kr)로 탈퇴 요청을 보내주시면 처리해드립니다.',
      },
    ],
  },
  {
    category: '클래스 참여',
    items: [
      {
        q: '처음 참여하는데 준비물이 있나요?',
        a: '대부분의 클래스는 재료를 제공합니다. 클래스 상세 페이지의 "클래스 정보"에서 준비물을 확인하세요.',
      },
      {
        q: '재수강 할인이 있나요?',
        a: '일부 강사는 재수강 할인 쿠폰을 제공합니다. 클래스 수료 후 강사가 쿠폰을 발급하는 경우 알림으로 안내됩니다.',
      },
      {
        q: '후기는 어떻게 작성하나요?',
        a: '수강 완료(결제 완료) 상태의 클래스가 있다면 클래스 상세 페이지 하단 후기 섹션에서 별점과 내용을 남길 수 있습니다.',
      },
    ],
  },
]

// FAQPage 구조화 데이터 — AI 검색·구글이 답변을 직접 인용
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.flatMap((s) => s.items).map((i) => ({
    '@type': 'Question',
    name: i.q,
    acceptedAnswer: { '@type': 'Answer', text: i.a },
  })),
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left"
    >
      <div className="flex items-center justify-between py-4 border-b border-brand-mist/20 gap-4">
        <p className={`text-sm font-medium transition-colors ${open ? 'text-brand-deep' : 'text-brand-ink'}`}>
          {q}
        </p>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-brand-grey transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </div>
      {open && (
        <p className="text-sm text-brand-grey leading-relaxed py-3 px-1">
          {a}
        </p>
      )}
    </button>
  )
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <JsonLd data={faqLd} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">FAQ</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-2">자주 묻는 질문</h1>
        <p className="text-brand-grey text-sm mb-10">궁금한 점이 있으시면 아래 내용을 먼저 확인해보세요</p>

        <div className="space-y-6">
          {faqs.map((section) => (
            <div key={section.category} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
              <h2 className="text-base font-semibold text-brand-ink mb-2">{section.category}</h2>
              <div>
                {section.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-brand-deep/5 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-brand-ink mb-1">더 궁금한 점이 있으신가요?</p>
          <p className="text-sm text-brand-grey">
            이메일로 문의해주세요:{' '}
            <a href="mailto:contact@authenticart.co.kr" className="text-brand-deep underline">
              contact@authenticart.co.kr
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
