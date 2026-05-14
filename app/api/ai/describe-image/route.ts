import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { imageUrl, type } = await req.json()
  if (!imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 })

  const prompts: Record<string, string> = {
    artwork: `이 공예 작품 사진을 보고 판매 상세 설명을 한국어로 작성해주세요.
작품의 재질, 색감, 분위기, 특징을 자연스럽게 2~4문장으로 설명하세요.
구매자가 매력을 느낄 수 있도록 감성적으로 작성하되, 과장 없이 실제 작품에 충실하게 써주세요.
설명만 바로 출력하고, 앞뒤 부가 설명은 넣지 마세요.`,

    product: `이 공예 재료/상품 사진을 보고 판매 상세 설명을 한국어로 작성해주세요.
상품의 종류, 색상, 용도, 특징을 2~4문장으로 간결하게 설명하세요.
구매자가 어떻게 활용할 수 있는지 포함하면 좋습니다.
설명만 바로 출력하고, 앞뒤 부가 설명은 넣지 마세요.`,

    class: `이 공예 클래스 관련 사진을 보고 클래스 소개 설명을 한국어로 작성해주세요.
클래스에서 만들 수 있는 작품, 배울 수 있는 기술, 완성품의 매력을 2~4문장으로 설명하세요.
수강생이 클래스에 참여하고 싶어지도록 흥미롭게 작성해주세요.
설명만 바로 출력하고, 앞뒤 부가 설명은 넣지 마세요.`,
  }

  const prompt = prompts[type] ?? prompts.artwork

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    })

    const description = response.choices[0]?.message?.content?.trim() ?? ''
    return NextResponse.json({ description })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'AI 생성 실패' }, { status: 500 })
  }
}
