/**
 * JSON-LD 구조화 데이터 출력 컴포넌트.
 * 검색엔진과 AI 검색(ChatGPT·Perplexity·Google AI Overviews 등)이
 * 페이지의 엔티티·관계를 정확히 이해하도록 schema.org 데이터를 삽입한다.
 *
 * JSON.stringify 결과의 '<' 를 유니코드 이스케이프하여 </script> 주입을 차단한다.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <script
      type="application/ld+json"
      // 안전: 직렬화된 JSON-LD만 출력하며 '<'를 이스케이프함 (XSS 불가)
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
