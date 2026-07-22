---
agent: main (design-director 역할)
session: 20260717-new-business
timestamp: 2026-07-17
inputs-read:
  - Screenshot_61.png (실사 랙돌 정면 — 씰 바이컬러, 역V 블레이즈, 파란 눈)
  - Screenshot_62.png (랙돌 인형 키링 — 통통한 체형, INFJ 태그)
  - 00-session-meta.md (게이트 1·2 결정사항)
  - competitor-analyst-output.md (감정 서사 필요성, Pusheen 유사성 회피)
  - legal-researcher-output.md (AI 저작권 워크플로우 요건)
next-agents:
  - proposal-writer
status: requires-review
---

# 랙돌 캐릭터 IP — 디자인 설계서 v0.1

> 이 문서는 **AI 초안 생성용 설계도**다. 최종 캐릭터는 대표가 AI 초안을 Procreate/Photoshop으로 직접 수정해 확정한다(저작권 요건).

---

## 1. 설계 원칙 — 단순화의 기준

**단순화의 목적은 "덜 그리기"가 아니라 "작게 표시돼도 즉시 알아보게 하기"다.**
스티커는 메신저에서 100~200px로 표시된다. 이 크기에서 살아남는 요소만 남긴다.

| 반드시 지킬 것 (캐릭터 DNA) | 이유 |
|---|---|
| **역V자 이마 블레이즈** | 실루엣·흑백에서도 우리 캐릭터를 식별시키는 **결정적 표식**. 절대 제거 금지 |
| **큰 사파이어 블루 눈** | 랙돌의 품종 시그니처. 감정 전달의 90%를 담당 |
| **씰 포인트 귀·마스크** (다크 브라운) | 화이트 몸통과의 명도 대비 = 작게 봐도 형태가 읽힘 |
| **핑크 삼각 코** | 얼굴 중심의 단 하나의 컬러 포인트 |
| **통통한 원형 실루엣** | 레퍼런스2(인형)의 체형. 포근함·귀여움의 근거 |

| 과감히 뺄 것 | 이유 |
|---|---|
| 털 한 올 단위 묘사 | 작은 크기에서 회색 뭉치로 뭉개짐 |
| 사실적 명암·그라데이션 | 플랫 컬러가 스티커 가독성 압도적 우위 |
| 수염(whiskers) | 배경과 섞여 노이즈가 됨. 뺄수록 얼굴이 강해짐 |
| 입 선 | 없거나 아주 작은 곡선만. 눈에 표현을 집중 |
| 발가락·발톱 디테일 | 뭉툭한 덩어리로 단순화 |

## 2. 표현(Expression)을 강하게 만드는 법 — 핵심 3가지

1. **눈 확대 + 저배치**: 실사 대비 **1.5~2배 확대**, 얼굴 중앙보다 **아래쪽에 배치**. 아기 비율(baby schema)이 되어 감정 이입이 급증한다. Pusheen·Gudetama·Molang 모두 이 원리를 쓴다.
2. **명도 대비 극대화**: 다크 씰 마스크 ↔ 화이트 블레이즈의 경계를 선명하게. 흐릿한 경계는 표정을 죽인다.
3. **눈꺼풀 각도 하나로 감정 전환**: 형태를 바꾸지 말고 **반쯤 감긴 눈꺼풀의 각도와 높이만** 조절해 감정을 만든다. 일관성 유지의 핵심 기법.

## 3. 감정 코드 — 캐릭터의 서사 축

분석 결론: "랙돌이라 귀엽다"로는 팬덤이 형성되지 않는다. 감정 서사가 필요하다.

**제안 코드: "나른함(Flop) — 애써 힘내지 않아도 괜찮은 존재"**

- 랙돌은 안으면 인형처럼 축 늘어지는(flop) 품종 특성이 있다 → 품종 사실 = 감정 코드
- 번아웃 세대의 "그냥 늘어져 있고 싶다"는 감정과 직결
- Gudetama(무기력)의 성공 구조와 동일하되, 게으름이 아니라 **포근한 안심**으로 차별화
- 기본 표정 = 반쯤 감긴 눈의 나른한 평온

**⚠️ MBTI 연계 (레퍼런스2의 INFJ 태그)**: 실제로 유효한 아이디어. MBTI는 영미권·일본 모두 소비되는 자기표현 코드이고, **16종 = 자연스러운 SKU 확장 + 수집 욕구 + "내 유형" 공유 바이럴**을 만든다. 단 감정 코드(나른함)를 캐릭터 본체에 먼저 확립한 뒤 파생 라인으로 붙일 것. 처음부터 16종을 벌리면 캐릭터 정체성이 흐려진다.

## 4. 컬러 팔레트 (플랫 지정)

| 용도 | 컬러 | 비고 |
|---|---|---|
| 씰 포인트 (귀·마스크·꼬리) | `#4A342C` ~ `#5C4033` | 다크 브라운. 검정 금지(무거워짐) |
| 몸통·블레이즈 | `#FAF6F0` ~ `#FFFFFF` | 크림 화이트 |
| 눈동자 | `#4A90D9` ~ `#5BA3E0` | 사파이어 블루. **채도 높게** |
| 코·발바닥 | `#E8A0A8` | 소프트 핑크 |
| 아웃라인 | `#3D2B24` | 순수 검정 대신 브라운 계열 |
| 배경 (브랜드) | `#F0A830` ~ `#FFBF00` | 레퍼런스1의 앰버. 파란 눈의 보색 → 눈이 튀어나옴 |

**앰버 배경 + 블루 아이는 보색 대비**라 시선이 눈으로 강제 집중된다. 레퍼런스1이 이미 이걸 하고 있다.

## 5. ⚠️ Pusheen 유사성 회피 (법무 필수)

legal-researcher 경고: AI 학습 데이터에 Pusheen이 포함돼 실질적 유사성 침해 청구 리스크 존재.

| 항목 | Pusheen | 우리 캐릭터 (의도적 차별화) |
|---|---|---|
| 색 | 회색 태비 + 줄무늬 | **씰 바이컬러 + 역V 블레이즈** |
| 눈 | 점(dot) 눈 | **큰 사파이어 블루 원형 눈** |
| 몸 | 납작한 식빵형 | **풍성한 털의 둥근 형태 + 긴 꼬리** |
| 감정 | 먹고 자는 일상 유머 | **나른한 안심·포근함** |

**프롬프트에 절대 넣지 말 것**: Pusheen, Hello Kitty, Sanrio, Gudetama, Molang, Chiikawa 등 **기존 캐릭터명·브랜드명**. 스타일 모방 지시도 금지.

## 6. AI 초안 생성 프롬프트 (Midjourney 기준)

### 6-1. 캐릭터 원형 (최초 1회 — 이 결과에서 `--cref` 기준 이미지 선정)

```
flat vector chibi cat mascot, original character design, seal bicolor coloring,
dark seal-brown ears and face mask with crisp white inverted-V blaze down the
forehead, white muzzle and chest, cream white round chubby body, fluffy
seal-brown tail, very large round sapphire blue eyes placed low on face,
baby-like proportions, two small white highlight dots in eyes, tiny pink
triangle nose, no mouth, no whiskers, no fur texture, completely flat solid
colors, clean bold brown outlines, sleepy half-lidded drowsy peaceful
expression, cozy and calm mood, simple amber gold background, minimal kawaii
vector sticker art, high contrast, bold readable silhouette --ar 1:1 --niji 6
```

### 6-2. 일관성 유지 (2회차 이후 전부)

```
[포즈·상황 설명] --cref [원형이미지URL] --cw 100 --ar 1:1 --niji 6
```
- `--cw 100` = 캐릭터 특징 최대 고정. **얼굴 일관성이 생명이므로 100 유지**
- `--niji 6` = 애니메 스타일 엔진. 플랫 캐릭터에 `--v 6`보다 적합

### 6-3. 스티커 8종 초안 포즈 (LINE 스탬프 최소 단위)

| # | 포즈·감정 | 프롬프트 추가구 |
|---|---|---|
| 1 | 기본 앉은 정면 | `sitting front view, calm sleepy gaze` |
| 2 | 배 깔고 완전히 늘어짐 (시그니처) | `flopped down flat on belly, legs splayed out, fully relaxed, melting` |
| 3 | 꾸벅꾸벅 졸기 | `head nodding, eyes closing, tiny z z z symbols` |
| 4 | 이불 속 | `peeking out from under a blanket, only face visible` |
| 5 | 하트 (사랑) | `looking up warmly, small heart symbol floating above` |
| 6 | 놀람 | `eyes wide open round, small surprise mark` |
| 7 | 응원 (약하게) | `tiny paw raised weakly, gentle encouraging look` |
| 8 | 굿나잇 | `curled up in a ball, sleeping peacefully, crescent moon` |

**2번(flop)이 이 캐릭터의 시그니처 포즈다.** 가장 공들여 만들 것.

## 7. 대표 수정 작업 — 저작권 확보 필수 절차

AI 초안은 **초안일 뿐**이며, 아래를 거쳐야 저작권 주장 근거가 생긴다(legal-researcher 결론).

1. AI 생성 원본 **전부 보관** (날짜·프롬프트·툴명 기록)
2. 선별 시 **선택 이유를 메모**로 남김
3. **Procreate/Photoshop으로 실질 수정**:
   - 역V 블레이즈 형태를 손으로 다시 그려 고유화
   - 눈 크기·위치를 직접 조정
   - 컬러를 위 팔레트 값으로 직접 교체
   - 불필요 요소 제거·재배치
4. **수정 전/후 파일 모두 보관** (.psd/.procreate 레이어 유지). 화면 녹화 권장
5. 캐릭터명·서사·대사는 **대표가 직접 창작** (텍스트는 독립 저작권 인정 가능성 높음)

## 8. 다음 액션

- [ ] 캐릭터명 확정 (→ 확정 즉시 미국 상표 출원. 게이트2 결정사항)
- [ ] 6-1 프롬프트로 원형 초안 생성 → 대표 수정 → 확정
- [ ] 확정 캐릭터로 8종 스티커 → LINE Creators Market 제출(등록비 0원)
- [ ] Redbubble 20~30종 업로드 (첫 현금 최단 경로, 2~8주)
- [ ] 디자인 확정 후 유사성 클리어런스 검토(변호사)
