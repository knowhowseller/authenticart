# Worklog — 20260608 블로그(공예 매거진) + AI 검색 최적화(AEO)

## 핵심 결정사항
- **블로그 = 운영자/AI 작성 매거진**: board(커뮤니티)와 별도. admin·branch_manager만 작성, 공개는 발행글만 (이유: 홍보 콘텐츠 일관성)
- **AEO 우선 설계**: 단순 SEO를 넘어 AI 검색(ChatGPT·Perplexity·Google AI) 인용 최적화 (이유: 사용자 명시 요구)
  - blog_posts에 `excerpt`(AI 인용 스니펫), `faq`(FAQPage 구조화 데이터) 필드 포함
  - JSON-LD: Organization·WebSite(홈), BlogPosting·BreadcrumbList·FAQPage(상세), Blog(목록)
  - `/llms.txt` 신설(AI 에이전트용 사이트 가이드), robots에 AI 크롤러 14종 명시 허용
- **마크다운 렌더러 자체 구현**: 외부 의존성 0, dangerouslySetInnerHTML 미사용(시맨틱 HTML 직접 생성) → XSS 안전 + AI 파싱 우수
- **슬러그**: 한글 허용(URL 인코딩), 제목 자동 생성·중복 시 접미사

## 완료된 산출물
| 파일 | 경로 | 비고 |
|------|------|------|
| 마이그레이션 | `supabase/migrations/0047_blog_posts.sql` | 테이블+RLS+조회수 RPC+updated_at 트리거 |
| 공용 라이브러리 | `lib/blog.ts` | 타입·카테고리·slugify·헬퍼 |
| 마크다운 렌더러 | `components/blog/Markdown.tsx` | 무의존성 시맨틱 렌더러 |
| JSON-LD | `components/seo/JsonLd.tsx` | 구조화 데이터 출력 |
| 공개 목록 | `app/(public)/blog/page.tsx` | 카테고리 필터+Blog JSON-LD |
| 공개 상세 | `app/(public)/blog/[slug]/page.tsx` | generateMetadata+3종 JSON-LD+조회수 |
| 관리자 | `app/(admin)/admin/blog/page.tsx` + `BlogManager.tsx` | CRUD UI |
| API | `app/api/admin/blog/{create,update,delete}/route.ts` | role 재검증 |
| llms.txt | `app/llms.txt/route.ts` | AI 에이전트 가이드 |
| 수정 | robots.ts, sitemap.ts, page.tsx(홈), Header, Footer, admin/page.tsx | 네비+AEO 인프라 |

## 미완료 / 다음 세션 인계 사항
- [ ] **마이그레이션 0047 운영 DB 적용**: `npx supabase db push` (0041~0046 미적용분도 함께 확인)
- [ ] **첫 블로그 글 작성**: content-writer 에이전트로 AEO 글 생성 → /admin/blog 붙여넣기 발행
- [ ] **OG 이미지**: 블로그 글 대표 이미지 업로드 경로(현재 URL 직접 입력) — 추후 이미지 업로더 연동 검토
- [ ] **로고 파일 확인**: JSON-LD가 `/logo/symbol.png` 참조 — public 경로 존재 확인 필요

## 수정하면 안 되는 사항 (고정값)
- blog_posts RLS: 공개 read는 status='published'만 / 작성은 admin·branch_manager
- 강사 수수료 86.7%, 에이전시 수수료, 브랜드 컬러 등 기존 고정값 불변
