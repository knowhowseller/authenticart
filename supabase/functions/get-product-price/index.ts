import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader ?? '' } } }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const url = new URL(req.url)
    const productId = url.searchParams.get('product_id')
    if (!productId) {
      return new Response(JSON.stringify({ error: 'Missing product_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: product } = await admin
      .from('products')
      .select('id, name, retail_price, wholesale_price, stock_qty, is_active')
      .eq('id', productId)
      .single()

    if (!product || !product.is_active) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let role = 'member'
    if (user) {
      const { data: userData } = await admin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      role = userData?.role ?? 'member'
    }

    const price = ['instructor', 'admin'].includes(role)
      ? product.wholesale_price
      : product.retail_price

    return new Response(JSON.stringify({
      id: product.id,
      name: product.name,
      price,
      is_wholesale: ['instructor', 'admin'].includes(role),
      stock_qty: product.stock_qty,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
