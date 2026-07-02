<!-- Codex 코드리뷰 | repo: C:\Users\노하우셀러\authenticart | 생성: 2026-07-02 19:52 -->

[변경 요약]
 app/(auth)/login/page.tsx              | 10 ++++++----
 app/(public)/group-request/page.tsx    | 30 +++++++++++++++++++++++++++--
 app/api/payments/toss-success/route.ts | 35 +++++++++++++++++-----------------
 components/layout/Header.tsx           |  3 ++-
 proxy.ts                               | 19 ++++++++++++++----
 5 files changed, 69 insertions(+), 28 deletions(-)

**Findings**

- **[High] [proxy.ts:70-75](C:\Users\노하우셀러\authenticart\proxy.ts:70), [app/(admin)/admin/payouts/page.tsx:23](C:\Users\노하우셀러\authenticart\app\(admin)\admin\payouts\page.tsx:23), [app/api/admin/branch-payouts/mark-paid/route.ts:9](C:\Users\노하우셀러\authenticart\app\api\admin\branch-payouts\mark-paid\route.ts:9)**  
  `branch_manager` allowlist에 `/admin/payouts`가 포함되면서 지부장이 정산 관리 화면에 접근 가능합니다. 이 페이지는 `payouts`, `branch_payouts`를 지부 소유 범위로 필터링하지 않고 전체 조회하며, `BranchPayoutList`는 입금 처리 버튼도 노출합니다. API도 `admin` 또는 `branch_manager`만 확인하고 해당 지부의 정산인지 검증하지 않습니다. 결과적으로 지부장이 다른 지부 정산 정보를 보거나 `paid` 처리할 수 있습니다.  
  수정 방향: `/admin/payouts`를 admin 전용으로 유지하거나, 지부장용 별도 `/branch/...` 화면/API로 분리하고 `branches.manager_id === user.id` 조건을 서버 API까지 적용해야 합니다.

- **[Med] [app/api/payments/toss-success/route.ts:23-25](C:\Users\노하우셀러\authenticart\app\api\payments\toss-success\route.ts:23)**  
  `failRedirect`가 `reason`과 `type`을 문자열 보간으로 직접 쿼리에 붙입니다. `reason`은 일부 호출에서 이미 인코딩되어 있지만, 대부분은 raw 값이고 `type`은 사용자 입력에서 온 값입니다. `type=booking%26foo=bar` 같은 값으로 실패 페이지 쿼리를 오염시킬 수 있고, 향후 실패 페이지가 쿼리를 더 신뢰하게 되면 결제 흐름 혼선으로 이어질 수 있습니다.  
  수정 방향: `new URL('/payment/fail', request.url)` 생성 후 `searchParams.set('reason', reason)` / `set('type', normalizedType)`로 조립하고, `type`은 허용 목록으로 제한하세요.

- **[Low] [app/(public)/group-request/page.tsx:4](C:\Users\노하우셀러\authenticart\app\(public)\group-request\page.tsx:4), [app/(public)/group-request/page.tsx:12](C:\Users\노하우셀러\authenticart\app\(public)\group-request\page.tsx:12)**  
  `router.push('/board')` 제거 후 `useRouter`와 `router`가 미사용 상태로 남았습니다. 런타임 보안 이슈는 아니지만 `eslint`/빌드 품질 게이트에서 실패할 수 있습니다.  
  수정 방향: `useRouter` import와 `const router = useRouter()`를 제거하면 됩니다.

**잠재적 개선**

- 로그인 redirect 검증은 `//evil.com`을 막아 open redirect를 줄인 점은 좋습니다. 다만 내부 경로만 허용하려면 `/%5c%5cevil.com` 같은 브라우저별 경로 해석까지 고려해 `new URL(raw, origin)` 기반으로 origin 동일성 + pathname 검사로 표준화하면 더 단단합니다.
- `Header.tsx`의 `queueMicrotask` 변경은 큰 문제로 보이지 않지만, unmount 직전 예약된 setState를 완전히 피하려면 effect 내부 `let mounted = true` 가드를 둘 수 있습니다.

테스트는 실행하지 않았고, diff와 관련 파일 주변 맥락 기준으로 리뷰했습니다.