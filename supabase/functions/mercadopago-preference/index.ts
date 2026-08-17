import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const { drink_id, quantity, receiver_id, event_id } = await req.json()

    // Usar el cliente con Service Role para queries internas seguras
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Obtener datos del trago
    const { data: drink } = await supabaseAdmin.from('Drinks').select('*').eq('id', drink_id).single()
    if (!drink) throw new Error('Trago no encontrado')

    // 2. Obtener mi Profile
    const { data: sender } = await supabaseAdmin.from('Profiles').select('id').eq('user_id', user.id).single()
    
    // 3. Obtener token del Manager
    const { data: eventData } = await supabaseAdmin.from('Events').select('manager_id').eq('id', event_id).single()
    const { data: manager } = await supabaseAdmin.from('Managers').select('mp_access_token').eq('id', eventData.manager_id).single()
    
    // Usamos un token global de prueba de entorno si el manager no configuró uno
    const mpAccessToken = manager?.mp_access_token || Deno.env.get('MP_ACCESS_TOKEN')

    if (!mpAccessToken) {
      throw new Error('El evento no tiene pagos configurados')
    }

    const totalAmount = drink.price * quantity

    // 4. Crear transacción inicial en pendiente
    const { data: transaction } = await supabaseAdmin.from('Transactions').insert({
      event_id,
      sender_id: sender.id,
      receiver_id,
      drink_id,
      quantity,
      total_amount: totalAmount,
      status: 'pending'
    }).select('id').single()

    // 5. Llamar a Mercado Pago API para crear Preference
    const preferenceData = {
      items: [
        {
          id: drink.id,
          title: `GIRA: ${quantity}x ${drink.name}`,
          quantity: quantity,
          currency_id: 'ARS',
          unit_price: drink.price
        }
      ],
      back_urls: {
        // Redirigir a la app después de pagar
        success: "https://breadthegood.github.io/gira",
        failure: "https://breadthegood.github.io/gira",
        pending: "https://breadthegood.github.io/gira"
      },
      auto_return: "approved",
      external_reference: transaction.id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook?tx=${transaction.id}`
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccessToken}`
      },
      body: JSON.stringify(preferenceData)
    })

    const mpData = await mpResponse.json()
    if (!mpResponse.ok) {
       console.error("MP Error:", mpData)
       throw new Error('Error de MercadoPago')
    }

    // Actualizar la transacción con el ID de la preferencia
    await supabaseAdmin.from('Transactions').update({
       mp_preference_id: mpData.id
    }).eq('id', transaction.id)

    // Devolver la URL de pago (init_point redirige automáticamente a la app de MP en móvil)
    return new Response(JSON.stringify({ init_point: mpData.init_point }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
