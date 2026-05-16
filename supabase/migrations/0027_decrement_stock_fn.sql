-- 상품 재고 원자적 차감 함수
-- 0046_atomic_rpcs.sql에서 RETURNS jsonb로 재정의되므로 여기서도 통일
DROP FUNCTION IF EXISTS public.decrement_stock(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS        decrement_stock(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.decrement_stock(uuid, int4) CASCADE;
DROP FUNCTION IF EXISTS        decrement_stock(uuid, int4) CASCADE;

CREATE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  WITH updated AS (
    UPDATE public.products
       SET stock_qty = stock_qty - p_quantity
     WHERE id        = p_product_id
       AND stock_qty >= p_quantity
     RETURNING id
  )
  SELECT count(*) INTO v_updated FROM updated;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', '재고가 부족합니다');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;
