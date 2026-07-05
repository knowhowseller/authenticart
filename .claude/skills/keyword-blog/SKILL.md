---
name: keyword-blog
description: 오센틱아트 블로그(공예 매거진) 콘텐츠를 키워드 엔진 기반으로 발행한다. 감이 아니라 실검색량·SERP 의도 데이터로 주제를 정하고, 발행 성과를 엔진에 되먹여 강화한다. "블로그 발행/주제 선정/키워드 기반 콘텐츠/주차 홍보글" 요청 시 사용.
---

# 오센틱아트 키워드 기반 블로그 발행 파이프라인

감이 아니라 **데이터로 주제를 결정**하고, 발행 결과를 엔진에 되먹여 **쓸수록 정확해지는** 자기강화 발행 시스템. 공유 키워드엔진(`D:\키워드엔진`) + 오센틱 정제기(`scripts/keyword-refine.mjs`)를 축으로 한다.

> 이 스킬은 전역 스킬 **`keyword-engine-publish`**(전 프로젝트 공용 7단계 절차)의 **오센틱 특화판**이다. 전역 절차·함정·보안을 따르되, 여기서는 **공예 온토픽·블로그 7타겟·운영 DB 발행**을 특화한다.

## 도구 지도
- 공유 엔진 `D:\키워드엔진`(자기강화): `keywords.js`(검색량·경쟁) · `attack.js`(SERP 공략카드+`out/attack_log.csv`) · `cluster.js`(클러스터·사다리) · **`measure.js`**(발행물 실지표→outcomes.csv) · **`reinforce.js`**(성과→`data/weights.json`·`win_examples.json` 학습) · **`publish_log.csv`**(발행이력=측정대상). 자격은 볼트 밖 `.env`.
- 오센틱 정제기 `scripts/keyword-refine.mjs`: 엔진 out을 **공예 온토픽**으로 필터 + 7타겟 자동분류 → `outputs/04-marketing/keyword-plan-authenticart.csv`. (범용 패턴: [[도메인 온토픽 키워드 정제기 패턴 (앵커·오프토픽·N타겟)]])
- 오센틱 자동발행 `scripts/publish-blog.mjs`: `blog_posts` upsert+featured+publish_log 기록(대시보드 SQL 대체).
- 상위 지식: [[키워드 공략 엔진 (SERP 정찰→공략카드→성과 강화)]] · [[키워드 기반 자사웹·유튜브 유기성장 파이프라인]] · [[키워드엔진 스킬분리·content_plan 인터페이스]] · [[블로그 주차별 홍보글 작성·발행·검증 플레이북]].

## 절차 (매 발행 시)
**0. 회상** — `out/attack_log.csv`의 과거 공략·발행 URL과 정제 CSV를 먼저 읽는다. 승리(랭크인) 키워드 패턴을 우선 재사용.

**1. 수집(부족분만)** — 커버 약한 타겟 씨앗을 보강 수집. 예:
```
node D:\키워드엔진\keywords.js "씨앗1" "씨앗2" ... (최대 5개, 한글 OK)
```
(엔진 out/에 `naver_*.csv` 누적 — 정제기가 자동 통합)

**2. 정제** — 온토픽 필터 + 7타겟 분류:
```
node scripts/keyword-refine.mjs
```
→ `outputs/04-marketing/keyword-plan-authenticart.csv` (keyword,target,intent,vol,comp,score)

**3. 공략카드(상위 후보 SERP 정찰)** — 후보 키워드마다:
```
node D:\키워드엔진\attack.js "키워드"
```
의도(정보/상업/거래)·네이버 SERP 버티컬·경쟁·유튜브 수요 확인. 구글 SERP는 WebSearch로 보완.

**4. 주제 선정 (데이터 규칙)** ★
- **타겟 비중은 검색수요로 재조정**(균등 로테이션 금지). 수요 큰 타겟(입문·선물·커플·학부모)에 더 배분. 강사·B2B·작품은 검색유입 얇으면 블로그 대신 랜딩/영업.
- **의도 일치**: attack가 "상업·거래"면 순수 how-to 금지 → **후기/추천형 + 예약·작품 CTA**. "정보/Q&A"면 가이드/경험형.
- **헤드는 롱테일로 우회**: 완제품 쇼핑·대형기관이 점령한 헤드(디퓨저·어린이체험 등)는 **지역+공예유형 롱테일**로("수원 공방데이트", "디퓨저 원데이클래스", "어린이 레진 체험").
- 온토픽·검색량≥임계·slug 유니크 확인.

**5. 작성** — [[블로그 주차별 홍보글 작성·발행·검증 플레이북]] 준수: AEO 3종(excerpt+FAQ4+H2/H3), 광고법 안전, 브랜드 톤. CTA 실제 라우트(`/classes`·`/group-request`·`/artworks`·`/signup/instructor`). 산출물 `outputs/04-marketing/`. 발행 스크립트 입력용 `posts-N주차.json`(각 post에 **keyword·intent 메타 포함** — 성과측정 키)도 생성.

**6. 발행·검증(자동)** ★ — 대시보드 SQL 불필요. `node scripts/publish-blog.mjs outputs/04-marketing/posts-N주차.json` → `blog_posts` upsert(멱등)+featured 로테이션+**publish_log 자동기록** → `node scripts/indexnow-submit-all.mjs` 색인 → 한글 slug 라이브 검증(percent-encoding, HTTP200+H1+FAQ). ※ service role은 신형 `sb_secret_...`도 작동.

**7. 성과 측정·강화(루프 닫기)** ★ — `publish-blog.mjs`가 발행 시 `D:\키워드엔진\publish_log.csv`에 자동 기록(brand=오센틱아트, channel=web). 이후 **엔진 성과 루프**: `node D:\키워드엔진\measure.js`(GSC 노출·클릭·CTR·순위 → outcomes.csv) → `node D:\키워드엔진\reinforce.js`(win_examples·weights 학습). 주간 자동(작업스케줄러 **KeywordEngineWeekly** 월 09:00)에 포함 → 승리 패턴이 다음 주제선정 가중치로 반영돼 코드 수정 없이 정확해진다. 랭크인 키워드는 정제기 `ANCHORS`·플레이북 승리예시로도 승격.

## 고정 규칙
- 정제 노이즈 함정: 네이버 연관어는 오프토픽 섞임 → 반드시 정제기 통과분만 사용(엔진 원본 기회점수 상위는 '나는솔로·레시피' 노이즈일 수 있음).
- 크리덴셜(`.env`)은 깃·옵시디언 금지. 값 인용 없이 존재만 기록.
- 7타겟: ①입문 ②B2B ③강사 ④작품 ⑤커플 ⑥학부모 ⑦선물 (검색수요로 비중 조정).
