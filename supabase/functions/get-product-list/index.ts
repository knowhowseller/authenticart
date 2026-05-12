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
    const category = url.searchParams.get('category')
    const page = parseInt(url.searchParams.get('page') ?? '1')
    const pageSize = 20

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let role = 'member'
    if (user) {
      const { data: userData } = await admin
        .from('users').select('role').eq('id', user.id).single()
      role = userData?.role ?? 'member'
    }

    let query = admin
      .from('products')
      .select('id, name, category, retail_price, wholesale_price, stock_qty, thumbnail_url, description')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (category) query = query.eq('category', category)

    const { data: products, error } = await query
    if (error) throw error

    const isWholesale = ['instructor', 'admin'].includes(role)

    const result = (products ?? []).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: isWholesale ? p.wholesale_price : p.retail_price,
      is_wholesale: isWholesale,
      stock_qty: p.stock_qty,
      thumbnail_url: p.thumbnail_url,
      description: p.description,
    }))

    return new Response(JSON.stringify({ products: result, is_wholesale: isWholesale }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
