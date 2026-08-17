import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2"

serve(async (req) => {
  try {
    const url = new URL(req.url)
    // MercadoPago envia los datos en query params o body dependiendo del topic
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')
    
    if (topic !== 'payment' || !id) {
       return new Response('Ignored', { status: 200 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // En un webhook real, deberíamos buscar a qué cuenta pertenece el pago. 
    // Como simplificación (ya que la URL de notificación no lleva qué token usar),
    // usaremos el token de entorno principal o tendríamos que consultar la API de MP sin token, pero eso requiere token.
    // Para simplificar, buscamos si alguna transacción tiene mp_payment_id o si el merchant_order vincula.
    // Lo más rápido para este caso de uso: leer el body y buscar la transacción
    
    // Obtenemos info del body
    let body;
    try {
       body = await req.json()
    } catch {
       body = {}
    }

    // Obtener transaction ID de la query params si viene
    const txParam = url.searchParams.get('tx')

    let mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
    let transactionId = txParam

    // Si viene txParam, buscamos el token real del manager
    if (txParam) {
       const { data: txData } = await supabaseAdmin.from('Transactions').select('event_id').eq('id', txParam).single()
       if (txData) {
          const { data: evData } = await supabaseAdmin.from('Events').select('manager_id').eq('id', txData.event_id).single()
          if (evData) {
             const { data: mData } = await supabaseAdmin.from('Managers').select('mp_access_token').eq('id', evData.manager_id).single()
             if (mData?.mp_access_token) {
                mpAccessToken = mData.mp_access_token
             }
          }
       }
    }
    
    if (mpAccessToken) {
       const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
         headers: { 'Authorization': `Bearer ${mpAccessToken}` }
       })
       const paymentData = await paymentRes.json()
       
       if (paymentData && paymentData.status === 'approved') {
          const transactionId = paymentData.external_reference
          if (transactionId) {
             const { data: tx } = await supabaseAdmin.from('Transactions').select('*').eq('id', transactionId).single()
             
             if (tx && tx.status !== 'approved') {
                const qrCodeStr = `DRINK-${tx.id.split('-')[0].toUpperCase()}`
                
                // Actualizar Transacción
                await supabaseAdmin.from('Transactions').update({
                   status: 'approved',
                   mp_payment_id: id,
                   qr_code: qrCodeStr
                }).eq('id', transactionId)

                // Obtener datos para el chat
                const { data: drink } = await supabaseAdmin.from('Drinks').select('name, icon').eq('id', tx.drink_id).single()
                
                // Insertar Mensaje en el Chat
                // Primero necesitamos encontrar si ya hay Match entre sender_id y receiver_id
                const { data: match } = await supabaseAdmin.from('Matches')
                   .select('id')
                   .or(`and(profile1_id.eq.${tx.sender_id},profile2_id.eq.${tx.receiver_id}),and(profile1_id.eq.${tx.receiver_id},profile2_id.eq.${tx.sender_id})`)
                   .single()

                let finalMatchId = match?.id

                if (!match) {
                   const { data: newMatch } = await supabaseAdmin.from('Matches').insert({
                      profile1_id: tx.sender_id,
                      profile2_id: tx.receiver_id
                   }).select('id').single()
                   finalMatchId = newMatch?.id
                }

                if (finalMatchId) {
                   await supabaseAdmin.from('Messages').insert({
                      match_id: finalMatchId,
                      sender_id: tx.sender_id,
                      content: `🍹 ¡Te he invitado ${tx.quantity}x ${drink.name}! \nAquí está tu código para canjear en la barra:\n\n**${qrCodeStr}**\n\nMuestra este mensaje en la barra.`
                   })
                }
             }
          }
       }
    }

    return new Response('OK', { status: 200 })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
