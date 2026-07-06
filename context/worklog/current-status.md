# 오센틱아트 현재 상태 (최신)
> 마지막 갱신: 2026-07-05

---

## 2026-07-05 라이브 사이트 전 페이지 검토 (보완발전방향 제안)

- 🔴 **P0 발견 — Vercel 자동배포 중단**: 마지막 운영 배포 = 6/25 `fd9d442`(worklog 커밋). 이후 push된 9커밋(`826cb48`·`01410d6` 등 **7/2 보안·UX 보완 전부**)이 미배포. 라이브 증거: `/group-request` 인원 min=2(레포는 min=5). open redirect 방지·결제실패 type 분기·pending 주문 만료 cron·지부장 allowlist가 운영 미반영 상태. → **Vercel Git 연동/배포 일시정지 여부 확인 + 대표 승인 후 배포 재개**(역할·결제 인접 = 배포 게이트).
- ⚠️ **시드 데이터 노출**: 클래스 4건 ID `c0000000-…`, 강사 "박아트/김레진", 김유진 bio "레진아트 강사" 반복 깨짐(홈·강사소개 노출), 게시판 테스트 글 3건, 작품마켓 1점(로고 placeholder 이미지).
- ⚠️ **신뢰도**: 홈 통계 실수치 노출(3명/5개/1점), 재료쇼핑 0상품인데 메뉴·"최대 40% 절감" 카피 노출, 클래스 커버이미지 4/5 없음·회차 미등록(바로결제 비활성), 매거진 57편 cover_image 전부 미입력.
- 📌 **SEO·표기**: `/board` 타이틀 "…| 오센틱아트 | 오센틱아트" 중복, `/group-request` 타이틀 미설정, 푸터 전화·이메일 미표기(전상법)·© 2025.
- 상세: 옵시디언 [[오센틱아트 사이트 검토 2026-07]]

---

## 2026-07-05 키워드 엔진 블로그 파이프라인 + 5주차 자동 발행 (✅ 라이브 검증)

- ✅ **키워드 엔진 적용**: 전역 공유엔진 `D:\키워드엔진`(keywords/attack) + 신규 정제기 `scripts/keyword-refine.mjs`(공예 온토픽 필터+7타겟 분류, out 자동통합). 6,242행→**온토픽 796개**. 선물(집들이선물 50,800)·입문·커플 고수요 → **균등 7로테이션 폐기, 수요로 재조정**. SERP 공략카드(attack.js): 전 헤드 상업·거래 의도 → 후기/추천형+CTA, 헤드는 롱테일 우회.
- ✅ **5주차 7편 자동 발행**: `집들이선물·반지공방·디퓨저·공방데이트·상견례선물·도자기·어린이체험` 축. 신규 발행 스크립트 `scripts/publish-blog.mjs`(service role upsert+featured 로테이션+IndexNow, 멱등)로 **대시보드 SQL 없이 직접 발행**. published→57편, featured 5주차 Day1·4·7 ON/4주차 OFF. 라이브 7편 전부 200+H1+FAQ, IndexNow 76건.
- ✅ **자동 발행 파이프라인 확립**: 앞으로 `node scripts/publish-blog.mjs <posts.json>` 한 줄. 스킬 `keyword-blog`(전역 `keyword-engine-publish` 특화)로 표준화.
- 🔑 **service role key 이슈 해결**: 로컬·Vercel(production/preview/dev) **전부 유효 service role 키 없었음**(빈 값). Supabase 대시보드 신형 secret key(`sb_secret_...`)를 로컬 반영해 발행 성공.
- ⚠️ **미결·대표 확인**: ①Vercel 환경변수 `SUPABASE_SERVICE_ROLE_KEY`가 빈 값 → **앱 service role 기능(정산 cron·admin 서버작업) 동작 점검 필요**. ②발행에 쓴 secret key가 채팅 노출됨 → **Supabase에서 rotate(재발급) 필요**, 재발급 후 로컬·Vercel 동기화.

---

## 2026-07-02 역할 접근 경로·결제 전환 UX 보완 (빌드·tsc 통과, ⚠️배포 게이트 승인 대기)

2차 코드리뷰(역할별 진입경로/CTA·예약구매 전환·운영안정성) 지적 검증 후 타당 항목 보완. 결제 금액 계산 로직은 무변경.

- ✅ **proxy 권한 정렬(⚠️역할체계=배포게이트)**: ①지부장 `/admin` 허용(하위 admin전용 12페이지는 각자 `role==='admin'` 재검증) ②승인 에이전시 `/studio/agency` 허용(로그인만 확인, 소유는 페이지 판정) ③로그인 회원이 `/signup/instructor` 접근 시 홈이 아니라 `/my/instructor/apply`로 유도.
- ✅ **단체 출강 전환**: 홈 CTA `/board?tab=group_request`→`/group-request`(전용폼). 인원 기준 5인 통일(폼 min=5·홈문구·안내), API `participant_count>=5` 서버검증 추가.
- ✅ **로그인 후 복귀**: 클래스예약·상품구매 비로그인 시 `/login?redirect=<현재경로>`(login 페이지가 이미 redirect 처리).
- ✅ **결제 실패 화면 분기**: `/payment/fail?type=booking|order|cart|artwork|class_request` 별 CTA 분기. 5개 결제 시작점 failUrl에 type 전달.
- ✅ **장바구니 성공 후 정리**: cart 성공 리다이렉트에 `from=cart` 플래그 추가, `/my/orders`에서 그 경우만 clearCart(단품주문은 미정리). 실행 안 되던 cart page의 clearCart 제거.
- ✅ **pending 주문 만료 cron(⚠️결제인접)**: `/api/cron/expire-orders`(매시) — 1h 경과 pending 주문 만료+재고 복구(increment_stock, cancel 로직 재사용, status=pending 조건부라 멱등). vercel.json 등록.
- ✅ **로그인 회원 강사 전환 신청**: `/my/instructor/apply` 신규(계정필드 없이 instructor_profiles만 insert, 중복신청·기존강사 안내 분기).
- ✅ **런칭 UX 4종**: not-found·error·global-error·loading (2026-06-29 작업, 함께 커밋 대기).

### 3차 마감(2026-07-02 추가)
- ✅ **login open redirect 방지**: `?redirect=` 파라미터를 내부 절대경로(/…, //차단)만 허용 + `window.location.assign`(lint error 해소).
- ✅ **결제 서버검증 실패도 type 전달**: `failRedirect(request, reason, type)` — 금액불일치·승인실패 등 서버측 실패도 결제유형별 실패화면으로.
- ✅ **/admin 지부장 allowlist**: proxy에서 지부장은 실사용 7경로(instructors·classes·bookings·group-requests·notices·blog·payouts)+대시보드만 통과(전역허용→범위축소, 이중방어).
- ✅ **단체출강 완료 화면**: `/board` 이동 대신 전용 완료 UI(접수확인·24h 연락 안내·다음단계).
- ✅ **Header lint error 해소**: effect 내 동기 setState→queueMicrotask defer.
- 📌 **미반영(별도)**: 추가4 배송비 정책 통일(⚠️게이트), 추가6 회차요청 내부화, 추가7 필터 모바일, 추가8 카드 액션 정리(UI). lint 잔여(대부분 기존 any 타입·img 경고)는 별도 정리 대상.

---

## 2026-06-29 런칭 점검 + UX 마감 4종 추가 (빌드·tsc 통과, 커밋 대기)

- ✅ **런칭 UX 마감 4종 신규**: `app/not-found.tsx`(브랜드 404)·`app/error.tsx`(페이지 에러바운더리)·`app/global-error.tsx`(루트레이아웃 최종방어선, 인라인스타일)·`app/loading.tsx`(전역 스피너). 기존엔 error 1개(classes/[id])뿐, 404·loading 0개였음. `npm run build`·`tsc --noEmit` 통과. 결제·정산·role 로직 무변경(배포 게이트 비해당).
- ✅ **보안 기본기 양호 확인**: admin 페이지 27개·`/api/admin` 27개 전부 서버측 role 가드, cron 10개 전부 CRON_SECRET 검증. 비밀키 추적노출·console.log·TODO 0건.
- 📌 **P0 오진 정정**: "세션 끊김(updateSession 미호출)"은 오진. Next.js 16이 `middleware`→`proxy`로 리네임했고 이미 `proxy.ts`가 세션갱신+가드 수행 중. `lib/supabase/middleware.ts`는 미사용 잔재(건드리지 말 것).
- ⚠️ **미해결·대표 결정 대기 (RBAC 불일치)**: `proxy.ts` 미들웨어 가드가 페이지보다 엄격 → 페이지의 branch_manager 분기가 도달불가. `/admin/*`=admin만 통과하나 `admin/blog`는 지부장 허용 / `/studio/*`=instructor·admin만 통과하나 `studio/classes/[id]/edit`는 지부장(isPrivileged) 허용. CLAUDE.md B-1(/admin은 지부장 허용)과 어긋날 소지. **역할체계 사안=배포 게이트** → 지부장 접근 필요여부 확정 후 proxy 보정 or 페이지 죽은분기 정리.

---

## 2026-06-25 블로그 홍보글 4주차 7편 작성 + 발행 완료 (✅ 라이브 검증)

- ✅ **4주차 7편 작성 완료**: 1·2·3주차 7타겟 로테이션 유지·앵글 차별화. 7월 초 한여름 시즌 훅(더위·휴가철·사내행사). AEO 3종·광고법 안전 동일. slug 21편과 전부 다름. `outputs/04-marketing/20260702-오센틱아트-블로그홍보글7편-4주차.md(+.docx 21.7KB)`
- ✅ **운영 DB 발행 완료**: 대시보드 SQL 에디터에서 `20260702-블로그4주차-발행SQL.sql` 실행. published 43→**50편**. featured 4주차 Day1·4·7 ON / 3주차 Day1·4·7 OFF.
- ✅ **라이브 검증**: 신규 7편 전부 HTTP 200 + H1 + FAQPage 렌더링 확인. 강사글(Day3) 정산 86.7% 정상. (www.authenticart.co.kr) ※한글 slug는 percent-encoding 후 200(raw=500은 curl 인코딩 이슈).
- ✅ **IndexNow 일괄 색인**: sitemap 69건(신규 7편 포함) 200 OK 제출. 상세 `20260625-블로그홍보4주차-worklog.md`
- 4주차 목록: ①(월/guide,featured) 처음 클래스 예약·당일준비 ②(화/guide) 여름 사내행사 워크숍 ③(수/instructor) 강사 부업 현실(정산86.7%) ④(목/trend,featured) 여름 테이블 코스터·트레이 ⑤(금/story) 멀리 안 가는 여름 데이트 ⑥(토/guide) 더운날 실내 공예체험 ⑦(일/story,featured) 상황별 선물(집들이·승진·감사)

## 2026-06-25 블로그 홍보글 3주차 7편 작성 + 발행 완료 (✅ 라이브 검증)

- ✅ **3주차 7편 작성 완료**: 1·2주차 7타겟 로테이션 유지·주제 교체(여름 휴가철·방학 시즌 훅). AEO 3종·광고법 안전 동일. slug 1·2주차와 전부 다름. `outputs/04-marketing/20260625-오센틱아트-블로그홍보글7편-3주차.md(+.docx 22.1KB)`
- ✅ **운영 DB 발행 완료**: 사용자가 대시보드 SQL 에디터에서 `20260625-블로그3주차-발행SQL.sql` 실행(BEGIN/COMMIT). published 36 → **43편**. 확인 SELECT 7행 전부 published, featured Day1·4·7 ON.
- ✅ **featured 로테이션**: 3주차 Day1·4·7 ON, 2주차 Day1·4·7 OFF.
- ✅ **라이브 검증**: `/blog` 목록 + 신규 6글 상세 HTTP 200·H1·본문·FAQ 렌더링 확인. 강사글 정산 86.7% 문구 정상. (www.authenticart.co.kr)
- ✅ **IndexNow 일괄 색인**: `scripts/indexnow-submit-all.mjs` 실행 — sitemap 62건(신규 7편 포함) 200 OK 제출. (SQL 직접 INSERT는 자동 ping 안 돼 수동 실행)
- 📌 **이번 세션 특이사항**: execute_sql MCP가 **다른 Supabase 계정(vision-suite, ref axucxnfmbkhlunpiifce)으로 연결**돼 authenticart(coabfjizufovypfappco) 접근 불가 → 대시보드 SQL로 발행. 다음에 MCP 직접 발행하려면 오센틱아트 계정으로 재연결 필요. 상세 `20260625-블로그홍보3주차-worklog.md`

## 2026-06-20~21 검색 노출 강화: 빙 등록 + IndexNow + RSS (배포 완료)

- ✅ **빙 웹마스터 메타 태그**: `app/layout.tsx` verification.other에 `msvalidate.01` 추가. 구글·네이버에 이어 빙 소유확인 준비. (commit cfb6f7b)
- ✅ **IndexNow 자동 색인** (commit fb92a63): 빙·네이버·Yandex 등 참여 엔진에 즉시 색인 요청.
  - 키 파일 `public/9d0817bd5e9a59d21ab9bfb876612795.txt` (라이브 200 확인) + `lib/indexnow.ts` 제출 유틸
  - 블로그 발행/수정(create·update route)에서 발행 상태 시 자동 ping (fire-and-forget, 발행 안 막음)
  - `scripts/indexnow-submit-all.mjs`: sitemap 전체 일괄 제출 1회성
- ✅ **RSS 2.0 피드 `/rss.xml`**: 최신 발행글 50건, 30분 캐시. layout alternate 링크 노출. (라이브 200 확인)
- ✅ **사이트맵 55건 IndexNow 일괄 제출 완료**: 응답 202 Accepted.
- 📌 **사용자 수동 작업(웹마스터 UI)**: 빙/네이버/구글 콘솔에서 `sitemap.xml`·`rss.xml` 제출 + 빙 소유확인 버튼 클릭.
- 📌 **IndexNow 키는 비밀 아님**: 공개 검증 토큰. 키 변경 시 public 파일명·lib/indexnow.ts·스크립트 3곳 동시 변경 필요.

## 프로젝트 단계

- **Phase 0**: 완료 (기초 DB, 인증, 기본 UI)
- **Phase 1**: 핵심 기능 개발 중 (강의 예약, 결제, 강사 관리)
- **Phase 2**: 트리거 미도달 (미등록 강사 50명, 미달)

---

## 2026-06-09 보안·결제 수정 + 배송비 기능 (배포 완료)

- 🔴→✅ **D-1 과소결제 취약점 수정**: toss-success가 URL amount를 DB 실제금액과 대조 없이 paid 처리하던 문제 → 5개 결제 타입(booking·order·cart·artwork·class_request) 전부 서버 금액 검증 + 불일치 시 토스 결제 취소. (commit 5fe2f90)
- ✅ **D-2 멱등성**: 이미 paid인 주문 재호출 시 중복 정산·알림 방지.
- ✅ **C-1**: supabase/migrations/README.md — 중복 번호(0002/0005/0006) 문서화. 재번호 금지 규칙.
- ✅ **작가 배송비 기능**: migration 0048(artworks/artwork_orders.shipping_fee) 적용 완료. 결제액=작품가+배송비. (commit c6605ad)
- ⚠️ **배포 후 권장 테스트**: 실제 결제로 정상금액 통과/조작금액 차단 확인 (booking·쿠폰·작품). webhooks/toss 동일 검증 별도 검토.

## 2026-06-10 블로그 홍보 기획 + 타겟별 홍보글 7편 (✅ 운영 DB 발행 완료)

- ✅ **블로그 홍보 기획서 + 홍보글 7편 작성**: 타겟 7세그먼트(입문/B2B/강사/작품/커플/학부모/선물) 맞춤, AEO 3종(excerpt·FAQ·소제목) 적용, 광고법 안전. `outputs/04-marketing/20260610-오센틱아트-블로그홍보{기획,글7편}.md(+.docx)`
- ✅ **CTA 실제 라우트 반영**: `/classes`·`/artworks`·`/group-request`·`/signup/instructor`
- ✅ **운영 DB(blog_posts) 7건 published INSERT 완료** (사용자 승인, execute_sql): blog_posts 22편 → 29편. 홈 노출(is_featured) Day1·4·7=true. 라이브 검증: `/blog` 목록·3개 글 HTTP 200 + 본문 렌더링 확인 (www.authenticart.co.kr).
- 📌 후속(선택): 글별 cover_image(대표 이미지) URL 입력 — 현재 미입력(카드 이미지 없음). 상세 `20260610-블로그홍보7편-worklog.md`

## 2026-06-13 블로그 홍보글 2주차 7편 작성 + 운영 DB 발행 완료 (✅)

- ✅ **2주차 7편 작성 완료**: 기획서 로드맵대로 1주차 7타겟 로테이션 유지·주제만 교체. 여름·장마·여름방학 시즌 훅 반영. AEO 3종·광고법 안전 동일 기준. slug 1주차와 전부 다르게 생성. `outputs/04-marketing/20260613-오센틱아트-블로그홍보글7편-2주차.md(+.docx 21.9KB)`
- ✅ **운영 DB(blog_posts) 7건 published INSERT 완료** (사용자 승인 "즉시 published 일괄", execute_sql): published 29편 → **36편**. Day1·4·7=is_featured true.
- ✅ **홈 featured 로테이션**: 1주차 Day1·4·7(6/10) featured 내림 → 2주차 Day1·4·7 올림. 6/8 상록 가이드 2편(강사되는법·수수료비교)은 유지. **featured 총 5편**.
- ✅ **라이브 검증**: 새 글 3건 + `/blog` 목록 HTTP 200, 본문 렌더링 확인(www.authenticart.co.kr).
- 📌 후속(선택): 글별 cover_image URL 미입력(카드 이미지 없음). 상세 `20260613-블로그홍보2주차-worklog.md`

## 2026-06-10 CS 자동응답 봇 검증·정리 (커밋 완료, 푸시 대기)

- ✅ **CS봇 mini 모델 라이브 검증**: `/api/ai/cs` — 수수료(86.7%)·환불 단계 등 KB 질문 정상 답변, KB 밖(날씨 등) 질문은 채널톡 안내로 정확히 거부. 모델 `gpt-4o-mini-2024-07-18`, finish=stop, 키 정상.
- 📌 **어제 "과도 거부" 원인 확정**: 모델 문제 아님 → 터미널 테스트 시 **한글 인코딩 깨짐**이 원인이었음. (UTF-8 JSON 파일로 재검증해 확인) → 모델 gpt-4o 상향 불필요, mini 유지.
- ✅ **임시 진단 로깅 `?debug=1` 제거** (키 prefix·에러 노출 위험 제거) + catch 폴백 메시지 폐지된 게시판(/board) → 채널톡으로 통일. tsc --noEmit 통과. (commit 2a9fcd5)
- ⚠️ **미푸시**: 2a9fcd5 아직 origin 미반영 → push 시 Vercel 자동 배포.

## 2026-06-09 1인 운영 자동화 (배포 완료)

- **1순위**: class-reminder cron 활성화+윈도우 수정 / operator-digest(매일 09시 미처리 8종 요약) / weekly-kpi(매주 월) — admin 4명 발송
- **2순위**: 정산 지급 완료(mark-paid 단건·일괄) 시 강사 정산 명세 자동 발송 (monthlyPayoutHtml 연결, 계산 로직 불변)
- **3순위**: B2B 단체문의 자동 1차 응답(접수확인+절차) + admin 즉시 이메일·인앱 알림
- 미적용/판단대기: 강사신청 실시간 알림(signup 클라이언트 insert라 서버라우트화 필요, 다이제스트가 일단위 커버), 4순위(CS봇·블로그 파이프라인·후기 자동요청), 5순위(운영 대시보드)
- ⚠️ cron은 vercel.json 등록됨 — CRON_SECRET 환경변수 설정 전제(기존 7개 cron과 동일)

## 수정하면 안 되는 고정값

| 항목 | 값 | 이유 |
|------|-----|------|
| 강사 수수료 | PG 3.3% + 플랫폼 10% = **13.3% 공제, 강사 86.7% 수령** | 코드 로직(calcBookingFees) 반영됨 |
| 에이전시 수수료 | 스탠다드 10% / 실버 12% / 골드 15% | 제안서 확정, DB 반영 예정 |
| 브랜드 컬러 | 딥틸 DEEP `#1F4145` / 앰버 AMBER `#FFBF00` | 정본(context/brand). DOCX 스크립트 공통 적용. 옛 `#1A1A2E`/`#F59E0B`는 폐기 |

---

## 완료된 산출물 현황

### outputs/01-reports/
- `20260511-오센틱아트-Phase1-개발지시서.md` + `.docx`

### outputs/02-contracts/
- `20260513-오센틱아트-강사위촉계약서.md` + `.docx`
- `20260513-오센틱아트-B2B출강계약서.md` + `.docx`
- `20260513-오센틱아트-에이전시파트너십협약서.md` + `.docx`

### outputs/03-proposals/
- `20260513-파트너십제안서-공예사업자.md` + `.docx`
- `20260515-오센틱아트-B2B팀빌딩제안서.md` + `.docx` ✅ (14.4KB)
- `20260515-오센틱아트-에이전시파트너제안서.md` + `.docx` ✅ (14.4KB)
- `20260515-오센틱아트-강사모집제안서.md` + `.docx` ✅ (16.6KB)

### outputs/05-legal/
- `20260513-개인정보처리방침검토.md` + `.docx`
- `20260513-표시광고법검토.md` + `.docx`
- `20260513-전자상거래법검토.md` + `.docx`

### outputs/08-research/
- `20260513-경쟁분석-공예플랫폼.md` + `.docx`

---

## 최근 추가 기능 (2026-06-08)

- **블로그(공예 매거진) + AI 검색 최적화(AEO)** 신규 구축
  - 공개: `/blog`(목록), `/blog/[slug]`(상세) — JSON-LD(BlogPosting·FAQPage·BreadcrumbList)
  - 관리자: `/admin/blog` CRUD (admin·branch_manager) + AI 생성 마크다운 붙여넣기 지원
  - AEO 인프라: `/llms.txt`, robots AI 크롤러 허용, sitemap·홈 Organization/WebSite 구조화 데이터
  - 빌드/타입체크 통과, `as any` 0건 — 상세는 `20260608-블로그-AEO-worklog.md`
  - ✅ **마이그레이션 0047 운영 DB 적용 완료** (대시보드 SQL 에디터)
  - ✅ **배포 완료** (commit caea87a → main push → Vercel): `/blog`, `/llms.txt`, 홈 JSON-LD, robots AI 크롤러 라이브 검증
  - ⚠️ 같은 커밋에 **검토 안 된 결제·주문 변경분 8개**(toss/orders/bookings/cron)가 함께 배포됨 → 결제 흐름 정상 여부 확인 필요

## 미완료 / 다음 세션 인계 사항

- [ ] **migrations 0041~0047 운영 DB 적용**: `npx supabase db push` 실행 필요 (0047=블로그)
- [ ] **Vercel 환경변수 OPENAI_API_KEY 추가**: Vercel 대시보드에서 직접 추가
- [ ] **OpenAI API 키 폐기 및 재발급**: 이전 세션에서 노출된 키 → platform.openai.com에서 폐기
- [ ] **크론 설정 (사용자 승인 대기)**:
  - 주간 KPI 리포트 (매주 월 09:00)
  - 미처리 강사 신청 알림 (매일)
  - Phase 2 트리거 감지 (매일)
- [ ] **홈페이지 메인 콘텐츠 기획**: 이해관계자 대상 감성+CTA 설계 (중단됨)

---

## DOCX 생성 스크립트 현황

| 스크립트 | 대상 | 상태 |
|---------|------|------|
| `scripts/md-to-docx.mjs` | 범용 MD→DOCX 변환 | ✅ 사용 가능 |
| `scripts/make-b2b-proposal-docx.mjs` | B2B 팀빌딩 제안서 | ✅ |
| `scripts/make-agency-proposal-docx.mjs` | 에이전시 파트너 제안서 | ✅ |
| `scripts/make-instructor-proposal-docx.mjs` | 강사 모집 제안서 | ✅ |
