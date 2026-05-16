-- 목적: race condition 방지를 위한 atomic DB 함수
-- reserve_seat: 좌석 확인 + 예약 생성 + booked_count 증가를 단일 트랜잭션으로 처리
-- decrement_stock: 재고 확인 + 차감을 단일 트랜잭션으로 처리

-- ─────────────────────────────────────────────
-- 1. reserve_seat
-- ─────────────────────────────────────────────
-- 반환 타입 변경 시 OR REPLACE 불가 → 먼저 DROP
DROP FUNCTION IF EXISTS public.reserve_seat(uuid,uuid,integer,integer,integer,integer,boolean,timestamptz);

CREATE OR REPLACE FUNCTION public.reserve_seat(
  p_schedule_id        uuid,
  p_student_id         uuid,
  p_gross_amount       integer,
  p_pg_fee             integer,
  p_platform_fee       integer,
  p_instructor_payout  integer,
  p_is_request         boolean,
  p_approval_expires_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule record;
  v_booking_id uuid;
BEGIN
  -- 행 잠금으로 동시 예약 방지
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

  -- 중복 예약 확인
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE schedule_id = p_schedule_id
      AND student_id = p_student_id
      AND status NOT IN ('cancelled', 'rejected', 'expired', 'refunded')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', '이미 예약하셨습니다');
  END IF;

  -- 예약 삽입
  INSERT INTO public.bookings (
    schedule_id, student_id, status,
    approval_expires_at,
    gross_amount, pg_fee, platform_fee, instructor_payout
  ) VALUES (
    p_schedule_id, p_student_id, 'pending_approval',
    CASE WHEN p_is_request THEN p_approval_expires_at ELSE NULL END,
    p_gross_amount, p_pg_fee, p_platform_fee, p_instructor_payout
  )
  RETURNING id INTO v_booking_id;

  -- booked_count 증가
  UPDATE public.class_schedules
  SET booked_count = booked_count + 1
  WHERE id = p_schedule_id;

  RETURN jsonb_build_object('ok', true, 'booking_id', v_booking_id);
END;
$$;

-- ─────────────────────────────────────────────
-- 2. decrement_stock
-- ─────────────────────────────────────────────
-- 반환 타입 변경 시 OR REPLACE 불가 → 먼저 DROP
DROP FUNCTION IF EXISTS public.decrement_stock(uuid,integer);

CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id uuid,
  p_quantity   integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated integer;
BEGIN
  -- 재고 확인 후 차감 (stock_qty >= p_quantity 조건 만족 시에만 실행)
  WITH updated AS (
    UPDATE public.products
    SET stock_qty = stock_qty - p_quantity
    WHERE id = p_product_id
      AND stock_qty >= p_quantity
      AND is_active = true
    RETURNING id
  )
  SELECT COUNT(*) INTO v_updated FROM updated;

  IF v_updated = 0 THEN
    -- 상품이 없거나 재고 부족
    PERFORM 1 FROM public.products WHERE id = p_product_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', '상품을 찾을 수 없습니다');
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', '재고가 부족합니다');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;
