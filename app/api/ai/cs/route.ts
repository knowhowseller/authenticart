import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// 오센틱아트 CS 지식 베이스 — 봇은 이 정보 안에서만 답변하고, 벗어나면 사람에게 연결.
const KNOWLEDGE = `
[오센틱아트 기본]
- 레진아트·캔들·플라워·도자기·주얼리·자수·회화·목공예 등 전 장르 공예 클래스 예약, 강사 양성·인증, 작품 판매, 재료 도매 플랫폼.
- 운영 지역: 서울·인천·강릉·충주·부산·제주.

[예약·결제]
- 예약: 클래스 선택 → 일정 선택 → 결제. '바로 결제'는 즉시 확정, '강사 승인' 방식은 강사가 24시간 내 승인 후 결제 링크 발송.
- 결제수단: 신용/체크카드, 카카오페이, 네이버페이.
- 쿠폰: 예약 화면에서 코드 입력 후 적용.

[취소·환불]
- 클래스 시작 7일 전까지 전액 환불, 3~7일 전 50%, 3일 이내 환불 불가(클래스별 정책 상이할 수 있음).
- 환불은 승인 후 3~5 영업일 내 원결제수단으로 입금.
- 강사 사정으로 취소 시 전액 환불.

[강사]
- 국가공인 자격증 필수 아님. 포트폴리오·강의 역량 심사로 '오센틱아트 인증 강사'가 됨(플랫폼 자체 인증, 국가공인 아님).
- 수수료: PG 3.3% + 플랫폼 10% = 13.3% 공제, 강사가 결제액의 86.7% 수령. 클래스 등록 고정비 없음.
- 정산: 매월 말일 기준, 익월 10일 전후 등록 계좌로 입금.
- 공방 없이 출강·방문 클래스도 가능.

[작품 마켓]
- 작품 결제액 = 작품가 + 배송비(작가가 설정, 무료배송이면 0원).

[B2B 단체 출강]
- 기업 팀빌딩·학교 방과후/자유학기제·복지관 등 10인 이상 단체 출강. 인원·장르·일정에 따라 견적이 다르며 /group-request 에서 문의.

[재료 쇼핑]
- 강사 회원은 도매가 구매 가능. 재료 판매자는 /my/vendor/apply 로 입점 신청.

[기타]
- 회원 탈퇴·복잡한 개별 처리·기타 문의: 사이트 우측 하단 채널톡 상담으로 문의(영업시간 내 순차 응대). 이메일 contact@authenticart.co.kr 도 가능.
`

export async function POST(req: NextRequest) {
  const { question, history } = await req.json()
  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'question required' }, { status: 400 })
  }
  if (question.length > 500) {
    return NextResponse.json({ error: '질문이 너무 깁니다(500자 이내).' }, { status: 400 })
  }

  const messages: any[] = [
    {
      role: 'system',
      content: `당신은 공예·예술 플랫폼 '오센틱아트'의 고객지원 상담원입니다.
아래 '회사 정보'를 사용해 고객의 질문에 한국어로 친절하고 구체적으로(2~4문장) 답하세요.

# 회사 정보
${KNOWLEDGE}

# 지침
- 위 회사 정보로 답할 수 있는 질문이면 망설이지 말고 그 내용으로 분명하게 답하세요. (예: 강사 수수료, 환불 기간, 강사 자격, 결제수단, 배송비, 단체 출강, 운영 지역 등은 모두 회사 정보에 있습니다.)
- 회사 정보에 전혀 없는 주제(회사와 무관한 일반 상식, 특정 회원의 개별 계정 처리 등)일 때만 "정확한 답변이 어렵습니다. 사이트 우측 하단 채널톡으로 문의해 주세요." 라고 안내하세요.
- 환불·정산·수수료를 답할 때는 "정책 기준이며 클래스/상황에 따라 다를 수 있습니다"라고 덧붙이세요.
- 법률·세무·의료 단정 금지. 회사 정보에 없는 구체 수치나 사실을 지어내지 마세요.`,
    },
    ...(Array.isArray(history) ? history.slice(-6).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content ?? '').slice(0, 800),
    })) : []),
    { role: 'user', content: question },
  ]

  const debug = req.nextUrl.searchParams.get('debug') === '1'
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 350,
      temperature: 0.3,
      messages,
    })
    const answer = res.choices[0]?.message?.content?.trim() ?? '정확한 답변이 어렵습니다. 사이트 우측 하단 채널톡으로 문의해 주세요.'
    if (debug) {
      return NextResponse.json({
        answer,
        _debug: {
          keyPresent: !!process.env.OPENAI_API_KEY,
          keyPrefix: (process.env.OPENAI_API_KEY ?? '').slice(0, 7),
          model: res.model,
          finish: res.choices[0]?.finish_reason,
          usage: res.usage,
          msgCount: messages.length,
        },
      })
    }
    return NextResponse.json({ answer })
  } catch (e: unknown) {
    if (debug) {
      const err = e as { status?: number; message?: string; code?: string }
      return NextResponse.json({
        answer: '일시적으로 답변이 어렵습니다. 사이트 우측 하단 채널톡으로 문의해 주세요.',
        _debug: { error: true, status: err?.status, code: err?.code, message: err?.message, keyPresent: !!process.env.OPENAI_API_KEY },
      })
    }
    return NextResponse.json({ answer: '일시적으로 답변이 어렵습니다. 게시판(/board) 또는 contact@authenticart.co.kr 로 문의해 주세요.' })
  }
}
