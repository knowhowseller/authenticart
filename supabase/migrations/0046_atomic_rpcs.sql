-- 목적: race condition 방지를 위한 atomic DB 함수
-- 0027_decrement_stock_fn.sql이 decrement_stock(uuid,integer) RETURNS void로
-- 동일 시그니처를 먼저 생성하므로 CREATE OR REPLACE로 반환 타입 변경 불가.
-- 순수 DDL DROP으로 제거 후 재생성.

-- ─────────────────────────────────────────────
-- STEP 1: 기존 함수 제거 (IF EXISTS → 없으면 무시)
-- DO 블록 없이 순수 DDL로 처리 (EXCEPTION 핸들러가 실제 오류를 숨기는 문제 방지)
-- ─────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.reserve_seat(uuid,uuid,integer,integer,integer,integer,boolean,timestamptz) CASCADE;
DROP FUNCTION IF EXISTS        reserve_seat(uuid,uuid,integer,integer,integer,integer,boolean,timestamptz) CASCADE;

DROP FUNCTION IF EXISTS public.increment_stock(uuid,integer) CASCADE;
DROP FUNCTION IF EXISTS        increment_stock(uuid,integer) CASCADE;

DROP FUNCTION IF EXISTS public.decrement_stock(uuid,integer) CASCADE;
DROP FUNCTION IF EXISTS        decrement_stock(uuid,integer) CASCADE;

-- int4는 integer의 alias — pg_catalog에 따라 다를 수 있어 양쪽 시도
DROP FUNCTION IF EXISTS public.decrement_stock(uuid,int4) CASCADE;
DROP FUNCTION IF EXISTS        decrement_stock(uuid,int4) CASCADE;
DROP FUNCTION IF EXISTS public.increment_stock(uuid,int4) CASCADE;
DROP FUNCTION IF EXISTS        increment_stock(uuid,int4) CASCADE;

-- ─────────────────────────────────────────────
-- STEP 2: reserve_seat
-- ─────────────────────────────────────────────
CREATE FUNCTION public.reserve_seat(
  p_schedule_id         uuid,
  p_student_id          uuid,
  p_gross_amount        integer,
  p_pg_fee              integer,
  p_platform_fee        integer,
  p_instructor_payout   integer,
  p_is_request          boolean,
  p_approval_expires_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule   record;
  v_booking_id uuid;
BEGIN
  SELECT id, max_students, booked_count
    INTO v_schedule
    FROM public.class_schedules
   WHERE id = p_schedule_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', '일정을 찾을 수 없습니다');
  END IF;

  IF v_schedule.booked_count >= v_schedule.max_students THEN
    RETURN jsonb_build_object('ok', false, 'error', '잔여 좌석이 없습니다');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.bookings
     WHERE schedule_id = p_schedule_id
       AND student_id  = p_student_id
       AND status NOT IN ('cancelled', 'rejected', 'expired', 'refunded')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', '이미 예약하셨습니다');
  END IF;

  INSERT INTO public.bookings (
    schedule_id, student_id, status,
    approval_expires_at,
    payment_expires_at,
    gross_amount, pg_fee, platform_fee, instructor_payout
  ) VALUES (
    p_schedule_id, p_student_id,
    CASE WHEN p_is_request THEN 'pending_approval' ELSE 'approved' END,
    CASE WHEN p_is_request THEN p_approval_expires_at ELSE NULL END,
    CASE WHEN p_is_request THEN NULL ELSE now() + interval '30 minutes' END,
    p_gross_amount, p_pg_fee, p_platform_fee, p_instructor_payout
  )
  RETURNING id INTO v_booking_id;

  UPDATE public.class_schedules
     SET booked_count = booked_count + 1
   WHERE id = p_schedule_id;

  RETURN jsonb_build_object('ok', true, 'booking_id', v_booking_id);
END;
$$;

-- ─────────────────────────────────────────────
-- STEP 3: increment_stock (재고 복구)
-- ─────────────────────────────────────────────
CREATE FUNCTION public.increment_stock(
  p_product_id uuid,
  p_quantity   integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', '수량이 올바르지 않습니다');
  END IF;

  UPDATE public.products
     SET stock_qty = stock_qty + p_quantity
   WHERE id = p_product_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', '상품을 찾을 수 없습니다');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ─────────────────────────────────────────────
-- STEP 4: decrement_stock (재고 차감)
-- ─────────────────────────────────────────────
CREATE FUNCTION public.decrement_stock(
  p_product_id uuid,
  p_quantity   integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', '수량이 올바르지 않습니다');
  END IF;

  WITH updated AS (
    UPDATE public.products
       SET stock_qty = stock_qty - p_quantity
     WHERE id        = p_product_id
       AND stock_qty >= p_quantity
       AND is_active  = true
     RETURNING id
  )
  SELECT count(*) INTO v_updated FROM updated;

  IF v_updated = 0 THEN
    PERFORM 1 FROM public.products WHERE id = p_product_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', '상품을 찾을 수 없습니다');
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', '재고가 부족합니다');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;
