// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

// Función para procesar un depósito
async function processDeposit(supabaseAdmin: any, paymentInfo: any) {
  const depositId = parseInt(paymentInfo.external_reference, 10);
  if (isNaN(depositId)) {
    throw new Error(`Invalid deposit ID in external_reference: ${paymentInfo.external_reference}`);
  }

  console.log(`[Webhook] Procesando depósito para ID #${depositId}`);

  // 1. Buscar el depósito para obtener el monto y el user_id
  const { data: deposit, error: depositError } = await supabaseAdmin
    .from('deposits')
    .select('id, user_id, amount_ars, status')
    .eq('id', depositId)
    .single();

  if (depositError || !deposit) {
    throw new Error(`Depósito #${depositId} no encontrado.`);
  }

  // Si el depósito ya fue completado, no hacemos nada para evitar duplicados.
  if (deposit.status === 'completed') {
    console.log(`[Webhook] Depósito #${depositId} ya fue procesado. Omitiendo.`);
    return;
  }

  // 2. Acreditar el saldo al perfil del usuario
  console.log(`[Webhook] Acreditando ${deposit.amount_ars} créditos al usuario ${deposit.user_id}`);
  const { error: rpcError } = await supabaseAdmin.rpc('add_to_balance', {
    p_user_id: deposit.user_id,
    p_amount_to_add: deposit.amount_ars
  });

  if (rpcError) {
    console.error("[Webhook] Falló la llamada a RPC 'add_to_balance' para el depósito:", rpcError);
    // Podríamos marcar el depósito como fallido aquí
    await supabaseAdmin.from('deposits').update({ status: 'failed' }).eq('id', depositId);
    throw rpcError;
  }
  
  // 3. Actualizar el estado del depósito a 'completed'
  const { error: updateError } = await supabaseAdmin
    .from('deposits')
    .update({ 
      status: 'completed',
      mercado_pago_payment_id: paymentInfo.id.toString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', deposit.id);

  if (updateError) {
    console.error(`[Webhook] Error al actualizar el depósito #${depositId}:`, updateError);
    throw updateError;
  }
  
  console.log(`[Webhook] Depósito #${depositId} completado exitosamente.`);
}


// Función para procesar una transacción (flujo antiguo)
async function processTransaction(supabaseAdmin: any, paymentInfo: any) {
    const transactionId = paymentInfo.external_reference;
    // ... (El código que ya teníamos para procesar transacciones se mantiene aquí)
    console.log(`[Webhook] Procesando pago de transacción para ID #${transactionId}`);

     // Obtenemos los detalles de la transacción para saber cuánto reservar y en qué publicación
    const { data: transaction, error: txError } = await supabaseAdmin
        .from('transactions')
        .select('listing_id, game_price_ars')
        .eq('id', transactionId)
        .single();

    if (txError || !transaction) throw new Error(`Transacción ${transactionId} no encontrada.`);

    // --- PASO CLAVE: LLAMAMOS A LA FUNCIÓN PARA RESERVAR EL SALDO ---
    const { error: rpcError } = await supabaseAdmin.rpc('increment_reserved_amount', {
    p_listing_id: transaction.listing_id,
    p_amount_to_reserve: transaction.game_price_ars
    });

    if (rpcError) throw rpcError;

    console.log(`[Webhook] Saldo de ${transaction.game_price_ars} reservado para la publicación ${transaction.listing_id}.`);

    // Después de reservar, actualizamos el estado de la transacción
    const { error: updateError } = await supabaseAdmin
    .from('transactions')
    .update({ 
        status: 'pending_delivery',
        mercado_pago_payment_id: paymentInfo.id.toString(),
    })
    .eq('id', transactionId);

    if (updateError) throw updateError;
    
    console.log(`[Webhook] Transacción ${transactionId} actualizada a 'pending_delivery' exitosamente.`);
}


export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.type !== 'payment') {
    return new NextResponse("OK (not a payment notification)", { status: 200 });
  }

  const paymentId = body.data.id;
  console.log("[Webhook] Recibida notificación de pago de MP:", paymentId);

  const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
  const payment = new Payment(client);

  try {
    const paymentInfo = await payment.get({ id: paymentId });
    
    if (paymentInfo.status === 'approved' && paymentInfo.external_reference) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // --- LÓGICA DE DECISIÓN ---
      // Si el título del item contiene "créditos", es un depósito.
      // Esta es una forma simple, pero efectiva, de diferenciarlos.
      if (paymentInfo.additional_info?.items?.[0]?.title?.includes('créditos')) {
        await processDeposit(supabaseAdmin, paymentInfo);
      } else {
        await processTransaction(supabaseAdmin, paymentInfo);
      }
    }
  } catch (error) {
    console.error("Error al procesar el webhook:", error);
    return new NextResponse("Error processing webhook", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}