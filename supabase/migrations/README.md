# Supabase 마이그레이션 가이드

## ⚠️ 중복 번호 안내 (C-1 정리)

초기 개발 중 일부 마이그레이션이 **같은 번호**를 부여받았습니다. 모두 **운영 DB에 이미 적용**되었고
**멱등(idempotent)** 하므로 동작에는 문제가 없습니다. 다만 신규 환경 셋업 시 적용 순서 혼동을 막기 위해
아래에 명시합니다.

| 번호 | 파일 | 목적 | 적용 순서(파일명 알파벳순) |
|:---:|------|------|:---:|
| 0002 | `0002_add_payment_expires.sql` | bookings 결제 만료 컬럼 추가 | 1 (a) |
| 0002 | `0002_seed.sql` | 테스트 시드 데이터 | 2 (s) |
| 0005 | `0005_add_branch_manager.sql` | users.role 체크에 branch_manager 추가 | 1 (a) |
| 0005 | `0005_instructor_student_phone_policy.sql` | 강사의 수강생 phone 조회 RLS | 2 (i) |
| 0006 | `0006_branch_manager.sql` | branches 테이블 + 지부장 역할 | 1 (b) |
| 0006 | `0006_delete_user_fn.sql` | admin_delete_user SECURITY DEFINER 함수 | 2 (d) |

> Supabase CLI(`supabase db push`)는 **파일명 알파벳순**으로 적용하므로, 위 "적용 순서"대로 실행됩니다.
> 각 쌍은 서로 의존성이 없어(독립적인 alter/policy/function) 순서가 결과에 영향을 주지 않습니다.

## 🚫 하지 말 것 — 적용된 마이그레이션 재번호 금지

이미 운영에 적용된 마이그레이션의 **파일명(번호)을 바꾸지 마세요.** Supabase는 번호를 version으로
추적(`supabase_migrations.schema_migrations`)하므로, 이름을 바꾸면 다음 push에서 **새 마이그레이션으로
인식해 재실행**됩니다. 0002_seed 같은 시드는 재실행 시 중복 데이터를 유발할 수 있습니다.

## ✅ 향후 규칙

1. 새 마이그레이션은 **다음 순차 번호**(현재 최신 `0047` → 다음 `0048`)를 사용하고 **중복 번호 금지**.
2. 파일명: `NNNN_snake_case_description.sql` (4자리 0패딩).
3. 모든 마이그레이션은 **멱등**하게 작성: `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE`,
   `DROP POLICY IF EXISTS` 후 `CREATE POLICY`, `ADD COLUMN IF NOT EXISTS` 등.
4. 신규 테이블 생성 시 **RLS 활성화 + 정책** 필수, FK에 인덱스 추가.
5. 파일 상단에 `-- 목적:` 주석 포함.

## 적용 방법

```bash
npx supabase db push          # 미적용 마이그레이션 일괄 적용
# 또는 Supabase 대시보드 → SQL Editor 에 직접 붙여넣기 (멱등하므로 안전)
```

> 현재 운영 프로젝트 ref: `coabfjizufovypfappco`
